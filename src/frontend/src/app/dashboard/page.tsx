import Link from "next/link";
import { getMyReviews } from "@/lib/api";
import Pagination from "@/components/Pagination";

interface DashboardProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  let reviews;
  try {
    reviews = await getMyReviews(page, 10);
  } catch {
    reviews = null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Reviews</h1>
        <Link
          href="/dashboard/reviews/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          New Review
        </Link>
      </div>

      {!reviews || reviews.items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-500">
          You haven&apos;t written any reviews yet.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">
                    Title
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.items.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/reviews/${review.slug}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {review.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          review.status === "Published"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/reviews/${review.id}/edit`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>
                        <DeleteButton reviewId={review.id} />
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

function DeleteButton({ reviewId }: { reviewId: string }) {
  return (
    <form action={`/dashboard/reviews/${reviewId}/delete`} method="GET">
      <button type="submit" className="text-red-600 hover:text-red-800">
        Delete
      </button>
    </form>
  );
}
