import { Suspense } from "react";
import { getPublishedReviews } from "@/lib/api";
import ReviewCard from "@/components/ReviewCard";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";

interface HomeProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || undefined;

  let reviews;
  try {
    reviews = await getPublishedReviews(page, 12, search);
  } catch {
    reviews = null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Discover Book Reviews</h1>
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
      </div>

      {!reviews || reviews.items.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          {search
            ? `No reviews found for "${search}"`
            : "No reviews yet. Be the first to write one!"}
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
