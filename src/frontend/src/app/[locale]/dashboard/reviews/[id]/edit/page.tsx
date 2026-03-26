import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getReviewById } from "@/lib/api";
import ReviewForm from "@/components/ReviewForm";

interface EditReviewPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditReviewPage({ params }: EditReviewPageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("editor");

  let review;
  try {
    review = await getReviewById(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("editReview")}</h1>
      <ReviewForm review={review} />
    </div>
  );
}
