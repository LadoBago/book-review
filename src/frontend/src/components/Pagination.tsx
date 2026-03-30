"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
  searchParams?: Record<string, string>;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath = "/",
  searchParams = {},
}: PaginationProps) {
  const t = useTranslations("pagination");

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `${basePath}?${params.toString()}`;
  }

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          {t("previous")}
        </Link>
      )}
      {pages.map((page, i) => {
        const prev = pages[i - 1];
        const showEllipsis = prev !== undefined && page - prev > 1;
        return (
          <span key={page} className="flex items-center gap-1">
            {showEllipsis && <span className="px-1 text-gray-400">...</span>}
            <Link
              href={buildHref(page)}
              className={`rounded-md px-3 py-2 text-sm ${
                page === currentPage
                  ? "bg-orange-400 text-white"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {page}
            </Link>
          </span>
        );
      })}
      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          {t("next")}
        </Link>
      )}
    </nav>
  );
}
