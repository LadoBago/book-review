"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ReviewSummaryDto } from "@/types/review";

interface ReviewCardProps {
  review: ReviewSummaryDto;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const locale = useLocale();
  const date = new Date(review.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md"
    >
      {review.coverImageUrl ? (
        <div className="aspect-[3/2] overflow-hidden bg-gray-100">
          <img
            src={review.coverImageUrl}
            alt={review.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex aspect-[3/2] items-center justify-center bg-gray-100">
          <span className="text-4xl text-gray-300">📖</span>
        </div>
      )}
      <div className="p-4">
        <h2 className="line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-orange-600">
          {review.title}
        </h2>
        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
          <span>{review.authorName}</span>
          <span suppressHydrationWarning>{date}</span>
        </div>
      </div>
    </Link>
  );
}
