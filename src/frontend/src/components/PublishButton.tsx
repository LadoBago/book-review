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

  const label = hasDraft ? "Publish Draft" : "Publish";

  async function handlePublish() {
    setLoading(true);
    try {
      await publishReview(reviewId);
      router.push("/dashboard");
      router.refresh();
    } catch {
      alert("Failed to publish review");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "link") {
    return (
      <button
        onClick={handlePublish}
        disabled={loading}
        className="text-green-600 hover:text-green-800 disabled:opacity-50"
      >
        {loading ? "..." : label}
      </button>
    );
  }

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="shrink-0 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
    >
      {loading ? "Publishing..." : label}
    </button>
  );
}
