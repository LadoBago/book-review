import { NextResponse } from "next/server";

export async function GET() {
  const keycloakUrl =
    process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
    "http://localhost:8080/realms/book-review";
  const redirectUri = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const keycloakLogoutUrl = `${keycloakUrl}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${process.env.KEYCLOAK_CLIENT_ID}`;

  return NextResponse.redirect(keycloakLogoutUrl);
}
