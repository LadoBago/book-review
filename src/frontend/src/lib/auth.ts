import NextAuth from "next-auth";
import type { OIDCConfig } from "next-auth/providers";

declare module "next-auth" {
  interface Session {
    error?: string;
    isAdmin?: boolean;
    isSocialLogin?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    error?: string;
    isAdmin?: boolean;
    isSocialLogin?: boolean;
  }
}

const keycloakInternal = process.env.KEYCLOAK_ISSUER!;
const keycloakExternal = process.env.NEXT_PUBLIC_KEYCLOAK_URL || keycloakInternal;
const clientId = process.env.KEYCLOAK_CLIENT_ID!;

const keycloakProvider: OIDCConfig<Record<string, unknown>> = {
  id: "keycloak",
  name: "Keycloak",
  type: "oidc",
  clientId,
  client: { token_endpoint_auth_method: "none" },
  // Issuer must match the "iss" claim in the token (external URL used by browser)
  issuer: keycloakExternal,
  // All server-to-server calls use the internal Docker URL
  wellKnown: `${keycloakInternal}/protocol/openid-connect/.well-known/openid-configuration`,
  authorization: {
    url: `${keycloakExternal}/protocol/openid-connect/auth`,
    params: { scope: "openid profile email" },
  },
  token: `${keycloakInternal}/protocol/openid-connect/token`,
  userinfo: `${keycloakInternal}/protocol/openid-connect/userinfo`,
  jwks_endpoint: `${keycloakInternal}/protocol/openid-connect/certs`,
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [keycloakProvider],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at;
        // Extract sub from access token to match backend's authorId
        if (account.access_token) {
          try {
            const parts = account.access_token.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(
                Buffer.from(parts[1], "base64").toString()
              );
              if (payload.sub) {
                token.sub = payload.sub;
              } else {
                console.error("[auth] JWT access_token missing 'sub' claim");
              }
              const roles = payload.realm_access?.roles as string[] | undefined;
              token.isAdmin = roles?.includes("admin") ?? false;
              token.isSocialLogin = !!payload.identity_provider;
            }
          } catch (e) {
            console.error("[auth] Failed to decode access_token:", e);
          }
        }
        return token;
      }

      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      if (token.refreshToken) {
        try {
          const response = await fetch(
            `${keycloakInternal}/protocol/openid-connect/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: clientId,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
              }),
            }
          );

          const tokens = await response.json();

          if (!response.ok) {
            throw new Error("Failed to refresh token");
          }

          return {
            ...token,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? token.refreshToken,
            expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
          };
        } catch {
          return { ...token, error: "RefreshTokenError" };
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Never expose tokens to the client — only non-sensitive fields
      session.error = token.error;
      session.isAdmin = token.isAdmin ?? false;
      session.isSocialLogin = token.isSocialLogin ?? false;
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : undefined;
      if (token?.refreshToken) {
        try {
          await fetch(
            `${keycloakInternal}/protocol/openid-connect/logout`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: clientId,
                refresh_token: token.refreshToken,
              }),
            }
          );
        } catch {
          // Best-effort Keycloak session logout
        }
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});

/**
 * Read tokens from the encrypted NextAuth JWT cookie (server-side only).
 * Tokens are never exposed to the client via the session object.
 */
export async function getServerTokens(): Promise<{
  accessToken?: string;
  idToken?: string;
}> {
  const { cookies: getCookies } = await import("next/headers");
  const { decode } = await import("@auth/core/jwt");
  const cookieStore = await getCookies();

  // NextAuth v5 uses __Secure- prefix on HTTPS, plain name on HTTP.
  // Try both to handle local Docker (NODE_ENV=production but HTTP).
  const cookieNames = [
    "__Secure-authjs.session-token",
    "authjs.session-token",
  ];

  let sessionToken: string | undefined;
  let cookieName = cookieNames[0];

  for (const name of cookieNames) {
    // Try single cookie first
    sessionToken = cookieStore.get(name)?.value;
    if (sessionToken) {
      cookieName = name;
      break;
    }
    // Try reassembling chunked cookies (cookieName.0, .1, etc.)
    const chunks: string[] = [];
    for (let i = 0; ; i++) {
      const chunk = cookieStore.get(`${name}.${i}`)?.value;
      if (!chunk) break;
      chunks.push(chunk);
    }
    if (chunks.length > 0) {
      sessionToken = chunks.join("");
      cookieName = name;
      break;
    }
  }

  if (!sessionToken) return {};

  try {
    const decoded = await decode({
      token: sessionToken,
      salt: cookieName,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET!,
    });

    if (!decoded) return {};

    return {
      accessToken:
        typeof decoded.accessToken === "string"
          ? decoded.accessToken
          : undefined,
      idToken:
        typeof decoded.idToken === "string" ? decoded.idToken : undefined,
    };
  } catch {
    console.error("[auth] Failed to decode session token");
    return {};
  }
}
