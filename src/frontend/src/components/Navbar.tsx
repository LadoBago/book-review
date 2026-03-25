"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshTokenError") {
      signIn("keycloak");
    }
  }, [session?.error]);

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Book Review
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Browse
          </Link>
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-gray-200" />
          ) : session ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                My Reviews
              </Link>
              {session.isAdmin && (
                <Link
                  href="/dashboard/moderation"
                  className="text-sm text-orange-600 hover:text-orange-800"
                >
                  Moderation
                </Link>
              )}
              <div className="relative group">
                <button className="text-sm text-gray-500 hover:text-gray-700">
                  {session.user?.name} ▾
                </button>
                <div className="invisible absolute right-0 z-10 w-48 pt-2 group-hover:visible">
                  <div className="rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  <a
                    href={`${process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080/realms/book-review"}/account/#/security/signingin`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Change Password
                  </a>
                  <button
                    onClick={() => {
                      window.location.href = "/api/auth/federated-logout";
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => signIn("keycloak")}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
