"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishReview } from "@/lib/api";

interface PublishButtonProps {
  reviewId: string;
  hasDraft?: boolean;
  variant?: "button" | "link";
}

export default function PublishButton({ reviewId, hasDraft, variant = "button" }: PublishButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = hasDraft ? "Publish Draft" : "Publish";

  async function handlePublish() {
    setError(null);
    setLoading(true);
    try {
      await publishReview(reviewId);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish review");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "link") {
    return (
      <>
        <button
          onClick={handlePublish}
          disabled={loading}
          className="text-green-600 hover:text-green-800 disabled:opacity-50"
        >
          {loading ? "..." : label}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </>
    );
  }

  return (
    <div>
      <button
        onClick={handlePublish}
        disabled={loading}
        className="shrink-0 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? "Publishing..." : label}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
