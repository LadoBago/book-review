import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getModerationReviewById } from "@/lib/api";
import MarkdownPreview from "@/components/MarkdownPreview";
import ModerationActions from "@/components/ModerationActions";
import { Link } from "@/i18n/navigation";

interface ModerationDetailProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ModerationDetailPage({ params }: ModerationDetailProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const session = await auth();

  if (!session?.isAdmin) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("moderation");
  const tReview = await getTranslations("review");

  let review;
  try {
    review = await getModerationReviewById(id);
  } catch {
    notFound();
  }

  const date = new Date(review.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/moderation"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {t("backToQueue")}
        </Link>
        <ModerationActions reviewId={review.id} />
      </div>

      <article>
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
            <span>{tReview("by", { author: review.authorName })}</span>
            <span>{date}</span>
          </div>
        </header>

        <div className="mb-8">
          <MarkdownPreview content={review.body} />
        </div>

        {review.quotes.length > 0 && (
          <section className="border-t border-gray-200 pt-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              {tReview("favoriteQuotes")}
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
    </div>
  );
}
