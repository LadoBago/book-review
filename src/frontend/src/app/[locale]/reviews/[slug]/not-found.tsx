"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ReviewNotFound() {
  const t = useTranslations("review");

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">{t("notFoundTitle")}</h1>
      <p className="mt-2 text-gray-500">{t("notFoundMessage")}</p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
      >
        {t("backToHome")}
      </Link>
    </div>
  );
}
