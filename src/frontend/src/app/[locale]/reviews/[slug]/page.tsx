import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getReviewBySlug } from "@/lib/api";
import { auth } from "@/lib/auth";
import MarkdownPreview from "@/components/MarkdownPreview";
import { Link } from "@/i18n/navigation";
import UnpublishButton from "@/components/UnpublishButton";
import FacebookShareButton from "@/components/FacebookShareButton";

interface ReviewPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({
  params,
}: ReviewPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  try {
    const review = await getReviewBySlug(slug);
    const description = review.body.slice(0, 160).replace(/[#*_`]/g, "");
    const url = `https://bookreview.ge/${locale}/reviews/${slug}`;
    return {
      title: review.title,
      description,
      alternates: {
        canonical: url,
        languages: { en: `/en/reviews/${slug}`, ka: `/ka/reviews/${slug}` },
      },
      openGraph: {
        type: "article",
        title: review.title,
        description,
        url,
        publishedTime: review.createdAt,
        modifiedTime: review.updatedAt,
        authors: [review.authorName],
        ...(review.coverImageUrl && {
          images: [{ url: review.coverImageUrl, alt: review.title }],
        }),
      },
      twitter: {
        card: review.coverImageUrl ? "summary_large_image" : "summary",
        title: review.title,
        description,
        ...(review.coverImageUrl && {
          images: [review.coverImageUrl],
        }),
      },
    };
  } catch {
    return { title: t("reviewNotFound") };
  }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("review");

  let review;
  try {
    review = await getReviewBySlug(slug);
  } catch {
    notFound();
  }

  const session = await auth();
  const isAuthor = session?.user?.id === review.authorId;
  const isAdmin = session?.isAdmin ?? false;

  const date = new Date(review.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: review.title,
    datePublished: review.createdAt,
    dateModified: review.updatedAt,
    author: { "@type": "Person", name: review.authorName },
    ...(review.coverImageUrl && { image: review.coverImageUrl }),
    url: `https://bookreview.ge/${locale}/reviews/${review.slug}`,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8">
        <div className="flex flex-col gap-6 sm:flex-row">
          {review.coverImageUrl && (
            <div className="shrink-0 overflow-hidden rounded-lg sm:w-48">
              <img
                src={review.coverImageUrl}
                alt={review.title}
                className="h-auto w-full object-cover sm:h-64 sm:w-48"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-gray-900">{review.title}</h1>
              {(isAuthor || isAdmin) && (
                <div className="flex shrink-0 gap-2">
                  {isAuthor && (
                    <Link
                      href={`/dashboard/reviews/${review.id}/edit`}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t("edit")}
                    </Link>
                  )}
                  <UnpublishButton reviewId={review.id} />
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span>{t("by", { author: review.authorName })}</span>
              <span>{date}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mb-8">
        <MarkdownPreview content={review.body} />
      </div>

      {review.quotes.length > 0 && (
        <section className="border-t border-gray-200 pt-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            {t("favoriteQuotes")}
          </h2>
          <div className="space-y-4">
            {review.quotes.map((quote) => (
              <blockquote
                key={quote.id}
                className="border-l-4 border-orange-400 bg-orange-50 py-3 pl-4 pr-4 text-gray-700 italic"
              >
                &ldquo;{quote.text}&rdquo;
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <FacebookShareButton label={t("shareOnFacebook")} />
      </div>
    </article>
  );
}
