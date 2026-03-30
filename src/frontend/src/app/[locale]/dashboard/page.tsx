import { getTranslations, setRequestLocale } from "next-intl/server";
import { getMyReviews } from "@/lib/api";
import { ReviewStatus } from "@/types/review";
import Pagination from "@/components/Pagination";
import UnpublishButton from "@/components/UnpublishButton";
import PublishButton from "@/components/PublishButton";
import { Link } from "@/i18n/navigation";

interface DashboardProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function DashboardPage({ params, searchParams }: DashboardProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const tReview = await getTranslations("review");

  const sp = await searchParams;
  const page = Number(sp.page) || 1;

  let reviews;
  try {
    reviews = await getMyReviews(page, 10);
  } catch {
    reviews = null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Link
          href="/dashboard/reviews/new"
          className="rounded-md bg-orange-400 px-4 py-2 text-sm text-white hover:bg-orange-500"
        >
          {t("newReview")}
        </Link>
      </div>

      {!reviews || reviews.items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-500">
          {t("noReviews")}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">
                    {t("colTitle")}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-700">
                    {t("colStatus")}
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-700">{t("colDate")}</th>
                  <th className="px-4 py-3 font-medium text-gray-700">
                    {t("colActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.items.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={
                          review.status === ReviewStatus.Published
                            ? `/reviews/${review.slug}`
                            : `/dashboard/reviews/${review.id}/edit`
                        }
                        className="font-medium text-gray-900 hover:text-orange-600"
                      >
                        {review.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          review.status === ReviewStatus.Published
                            ? "bg-green-100 text-green-700"
                            : review.status === ReviewStatus.PendingReview
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {review.status === ReviewStatus.PendingReview
                          ? t("pendingApproval")
                          : review.status === ReviewStatus.Published
                            ? t("statusPublished")
                            : t("statusDraft")}
                      </span>
                      {review.hasDraft && (
                        <span className="ml-1 inline-block rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                          {t("draftPending")}
                        </span>
                      )}
                      {review.rejectionReason && (
                        <p className="mt-1 text-xs text-red-600">
                          {t("rejected", { reason: review.rejectionReason })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString(locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/reviews/${review.id}/edit`}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          {tReview("edit")}
                        </Link>
                        {review.status === ReviewStatus.Published ? (
                          <>
                            <UnpublishButton reviewId={review.id} variant="link" />
                            {review.hasDraft && (
                              <PublishButton reviewId={review.id} hasDraft variant="link" />
                            )}
                          </>
                        ) : review.status === ReviewStatus.PendingReview ? (
                          <span className="text-xs text-orange-600">{t("awaitingApproval")}</span>
                        ) : (
                          <PublishButton reviewId={review.id} variant="link" />
                        )}
                        {review.status === ReviewStatus.Draft && (
                          <DeleteButton reviewId={review.id} label={t("delete")} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <Pagination
              currentPage={reviews.page}
              totalPages={reviews.totalPages}
              basePath="/dashboard"
            />
          </div>
        </>
      )}
    </div>
  );
}

function DeleteButton({ reviewId, label }: { reviewId: string; label: string }) {
  return (
    <Link
      href={`/dashboard/reviews/${reviewId}/delete`}
      className="text-red-600 hover:text-red-800"
    >
      {label}
    </Link>
  );
}
