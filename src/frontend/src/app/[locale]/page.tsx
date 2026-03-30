import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublishedReviews } from "@/lib/api";
import ReviewCard from "@/components/ReviewCard";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";

interface HomeProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const tMeta = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: tMeta("siteDescription"),
    alternates: {
      canonical: `https://bookreview.ge/${locale}`,
      languages: { en: "/en", ka: "/ka" },
    },
  };
}

export default async function Home({ params, searchParams }: HomeProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const search = sp.search || undefined;

  let reviews;
  try {
    reviews = await getPublishedReviews(page, 12, search);
  } catch {
    reviews = null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-green-900">{t("title")}</h1>
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
      </div>

      {!reviews || reviews.items.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          {search
            ? t("noResultsSearch", { search })
            : t("noResults")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.items.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <div className="mt-8">
            <Pagination
              currentPage={reviews.page}
              totalPages={reviews.totalPages}
              searchParams={search ? { search } : {}}
            />
          </div>
        </>
      )}
    </div>
  );
}
