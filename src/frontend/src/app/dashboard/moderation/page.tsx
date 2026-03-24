import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPendingReviews } from "@/lib/api";
import { redirect } from "next/navigation";
import Pagination from "@/components/Pagination";
import ModerationActions from "@/components/ModerationActions";

interface ModerationProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ModerationPage({ searchParams }: ModerationProps) {
  const session = await auth();

  if (!session?.isAdmin) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;

  let reviews;
  try {
    reviews = await getPendingReviews(page, 10);
  } catch {
    reviews = null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Moderation Queue</h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Back to Dashboard
        </Link>
      </div>

      {!reviews || reviews.items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-500">
          No reviews pending approval.
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
                      className="text-lg font-medium text-gray-900 hover:text-blue-600"
                    >
                      {review.title}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">
                      by {review.authorName} &middot;{" "}
                      {new Date(review.createdAt).toLocaleDateString()}
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
