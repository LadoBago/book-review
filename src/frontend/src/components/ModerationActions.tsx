"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveReview, rejectReview } from "@/lib/api";

interface ModerationActionsProps {
  reviewId: string;
}

export default function ModerationActions({ reviewId }: ModerationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setError(null);
    setLoading(true);
    try {
      await approveReview(reviewId);
      router.push("/dashboard/moderation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await rejectReview(reviewId, reason.trim());
      router.push("/dashboard/moderation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "..." : "Approve"}
        </button>
        <button
          onClick={() => setShowReject(!showReject)}
          disabled={loading}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {showReject && (
        <div className="w-full max-w-sm space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (required)"
            maxLength={500}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{reason.length}/500</span>
            <button
              onClick={handleReject}
              disabled={loading || !reason.trim()}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
