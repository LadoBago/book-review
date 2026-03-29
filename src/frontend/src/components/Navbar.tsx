"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { locales, Locale } from "@/i18n/config";
import { getPendingReviews } from "@/lib/api";

export default function Navbar() {
  const { data: session, status } = useSession();
  const t = useTranslations("nav");
  const tLocale = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (session?.error === "RefreshTokenError") {
      signIn("keycloak");
    }
  }, [session?.error]);

  useEffect(() => {
    if (session?.isAdmin) {
      getPendingReviews(1, 1)
        .then((result) => setPendingCount(result.totalCount))
        .catch(() => {});
    }
  }, [session?.isAdmin, pathname]);

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale as Locale });
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          {t("siteTitle")}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t("browse")}
          </Link>
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-gray-200" />
          ) : session ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t("myReviews")}
              </Link>
              {session.isAdmin && (
                <Link
                  href="/dashboard/moderation"
                  className="relative text-sm text-orange-600 hover:text-orange-800"
                >
                  {t("moderation")}
                  {pendingCount > 0 && (
                    <span className="absolute -right-5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
                      {pendingCount}
                    </span>
                  )}
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
                    {t("changePassword")}
                  </a>
                  <button
                    onClick={() => {
                      window.location.href = "/api/auth/federated-logout";
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t("signOut")}
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
              {t("signIn")}
            </button>
          )}
          <div className="relative group">
            <button className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
              {tLocale(locale as Locale)}
            </button>
            <div className="invisible absolute right-0 z-10 w-32 pt-1 group-hover:visible">
              <div className="rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLocale(l)}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                      l === locale ? "font-medium text-gray-900" : "text-gray-600"
                    }`}
                  >
                    {tLocale(l)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
