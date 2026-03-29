import { NextResponse } from "next/server";
import { getServerTokens, signOut } from "@/lib/auth";

export async function GET() {
  const { idToken } = await getServerTokens();

  const keycloakUrl =
    process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
    "http://localhost:8080/realms/book-review";
  const redirectUri = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const clientId = process.env.KEYCLOAK_CLIENT_ID!;

  // Sign out from NextAuth first (also triggers back-channel Keycloak logout)
  await signOut({ redirect: false });

  const params = new URLSearchParams({
    post_logout_redirect_uri: redirectUri,
    client_id: clientId,
  });

  if (idToken) {
    params.set("id_token_hint", idToken);
  }

  return NextResponse.redirect(
    `${keycloakUrl}/protocol/openid-connect/logout?${params}`
  );
}
