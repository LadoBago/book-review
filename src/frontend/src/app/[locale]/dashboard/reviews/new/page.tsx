import { getTranslations, setRequestLocale } from "next-intl/server";
import ReviewForm from "@/components/ReviewForm";

interface NewReviewPageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewReviewPage({ params }: NewReviewPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("editor");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("newReview")}</h1>
      <ReviewForm />
    </div>
  );
}
