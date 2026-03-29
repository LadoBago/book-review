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

  // Show draft content if this is a published review with pending draft changes
  const hasDraft = review.hasDraft;
  const displayTitle = (hasDraft ? review.draftTitle : null) ?? review.title;
  const displayBody = (hasDraft ? review.draftBody : null) ?? review.body;
  const displayCoverImageUrl = hasDraft
    ? (review.draftCoverImageUrl === "" ? null : review.draftCoverImageUrl ?? review.coverImageUrl)
    : review.coverImageUrl;
  const displayQuotes: string[] = hasDraft && review.draftQuotes
    ? review.draftQuotes
    : review.quotes.map((q) => q.text);

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

      {hasDraft && review.status === "Published" && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t("draftRevisionNotice")}
        </div>
      )}

      <article>
        {displayCoverImageUrl && (
          <div className="mb-8 overflow-hidden rounded-lg">
            <img
              src={displayCoverImageUrl}
              alt={displayTitle}
              className="h-auto w-full max-h-96 object-cover"
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{displayTitle}</h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>{tReview("by", { author: review.authorName })}</span>
            <span>{date}</span>
          </div>
        </header>

        <div className="mb-8">
          <MarkdownPreview content={displayBody} />
        </div>

        {displayQuotes.length > 0 && (
          <section className="border-t border-gray-200 pt-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              {tReview("favoriteQuotes")}
            </h2>
            <div className="space-y-4">
              {displayQuotes.map((quote, index) => (
                <blockquote
                  key={index}
                  className="border-l-4 border-blue-500 bg-blue-50 py-3 pl-4 pr-4 text-gray-700 italic"
                >
                  &ldquo;{quote}&rdquo;
                </blockquote>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
