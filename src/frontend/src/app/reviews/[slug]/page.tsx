import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReviewBySlug } from "@/lib/api";
import MarkdownPreview from "@/components/MarkdownPreview";

interface ReviewPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const review = await getReviewBySlug(slug);
    const description = review.body.slice(0, 160).replace(/[#*_`]/g, "");
    return {
      title: review.title,
      description,
      openGraph: {
        title: review.title,
        description,
        ...(review.coverImageUrl && {
          images: [{ url: review.coverImageUrl }],
        }),
      },
    };
  } catch {
    return { title: "Review Not Found" };
  }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { slug } = await params;
  let review;
  try {
    review = await getReviewBySlug(slug);
  } catch {
    notFound();
  }

  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      {review.coverImageUrl && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <img
            src={review.coverImageUrl}
            alt={review.title}
            className="h-auto w-full max-h-96 object-cover"
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">{review.title}</h1>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span>By {review.authorName}</span>
          <span>{date}</span>
        </div>
      </header>

      <div className="mb-8">
        <MarkdownPreview content={review.body} />
      </div>

      {review.quotes.length > 0 && (
        <section className="border-t border-gray-200 pt-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Favorite Quotes
          </h2>
          <div className="space-y-4">
            {review.quotes.map((quote) => (
              <blockquote
                key={quote.id}
                className="border-l-4 border-blue-500 bg-blue-50 py-3 pl-4 pr-4 text-gray-700 italic"
              >
                &ldquo;{quote.text}&rdquo;
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
