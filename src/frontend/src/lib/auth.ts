import NextAuth from "next-auth";
import type { OIDCConfig } from "next-auth/providers";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
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
        token.expiresAt = account.expires_at;
        // Extract sub from access token to match backend's authorId
        if (account.access_token) {
          const payload = JSON.parse(
            Buffer.from(account.access_token.split(".")[1], "base64").toString()
          );
          token.sub = payload.sub;
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
      session.accessToken = token.accessToken;
      session.error = token.error;
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
