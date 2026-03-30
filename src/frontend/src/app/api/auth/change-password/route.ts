import { NextResponse } from "next/server";

export async function GET() {
  const keycloakUrl =
    process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
    "http://localhost:8080/realms/book-review";

  return NextResponse.redirect(
    `${keycloakUrl}/account/#/security/signingin`
  );
}
