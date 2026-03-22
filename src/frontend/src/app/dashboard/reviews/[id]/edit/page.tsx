import { notFound } from "next/navigation";
import { getReviewById } from "@/lib/api";
import ReviewForm from "@/components/ReviewForm";

interface EditReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditReviewPage({ params }: EditReviewPageProps) {
  const { id } = await params;

  let review;
  try {
    review = await getReviewById(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Edit Review</h1>
      <ReviewForm review={review} />
    </div>
  );
}
