import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getPendingReviews } from "@/lib/api";
import { redirect } from "next/navigation";
import Pagination from "@/components/Pagination";
import ModerationActions from "@/components/ModerationActions";
import { Link } from "@/i18n/navigation";

interface ModerationProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ModerationPage({ params, searchParams }: ModerationProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();

  if (!session?.isAdmin) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("moderation");
  const tReview = await getTranslations("review");

  const sp = await searchParams;
  const page = Number(sp.page) || 1;

  let reviews;
  try {
    reviews = await getPendingReviews(page, 10);
  } catch {
    reviews = null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {t("backToDashboard")}
        </Link>
      </div>

      {!reviews || reviews.items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-500">
          {t("noReviews")}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.items.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/dashboard/moderation/${review.id}`}
                      className="text-lg font-medium text-gray-900 hover:text-orange-600"
                    >
                      {review.title}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">
                      {tReview("by", { author: review.authorName })} &middot;{" "}
                      {new Date(review.createdAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <ModerationActions reviewId={review.id} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Pagination
              currentPage={reviews.page}
              totalPages={reviews.totalPages}
              basePath="/dashboard/moderation"
            />
          </div>
        </>
      )}
    </div>
  );
}
