"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unpublishReview } from "@/lib/api";
import ConfirmModal from "./ConfirmModal";

interface UnpublishButtonProps {
  reviewId: string;
  variant?: "button" | "link";
}

export default function UnpublishButton({ reviewId, variant = "button" }: UnpublishButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleUnpublish() {
    setShowConfirm(false);
    setError(null);
    setLoading(true);
    try {
      await unpublishReview(reviewId);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish review");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {variant === "link" ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="text-yellow-600 hover:text-yellow-800 disabled:opacity-50"
        >
          {loading ? "..." : "Unpublish"}
        </button>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="shrink-0 rounded-md border border-yellow-300 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
        >
          {loading ? "Unpublishing..." : "Unpublish"}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <ConfirmModal
        open={showConfirm}
        title="Unpublish Review"
        message="This review will no longer be visible to the public. You can republish it anytime from your dashboard."
        confirmLabel="Unpublish"
        confirmClassName="bg-yellow-600 text-white hover:bg-yellow-700"
        onConfirm={handleUnpublish}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
