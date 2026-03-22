import ReviewForm from "@/components/ReviewForm";

export default function NewReviewPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">New Review</h1>
      <ReviewForm />
    </div>
  );
}
