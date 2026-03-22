"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReview, updateReview, uploadCoverImage } from "@/lib/api";
import { ReviewDto } from "@/types/review";
import MarkdownEditor from "./MarkdownEditor";
import MarkdownPreview from "./MarkdownPreview";
import CoverImageUpload from "./CoverImageUpload";
import QuoteList from "./QuoteList";

interface ReviewFormProps {
  review?: ReviewDto;
}

export default function ReviewForm({ review }: ReviewFormProps) {
  const router = useRouter();
  const isEditing = !!review;

  const [title, setTitle] = useState(review?.title || "");
  const [body, setBody] = useState(review?.body || "");
  const [quotes, setQuotes] = useState<string[]>(
    review?.quotes.map((q) => q.text) || []
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    review?.coverImageUrl || null
  );
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(status: "Draft" | "Published") {
    setError(null);
    setSaving(true);
    try {
      const filteredQuotes = quotes.filter((q) => q.trim() !== "");
      if (isEditing) {
        await updateReview(review.id, { title, body, status, quotes: filteredQuotes });
      } else {
        await createReview({ title, body, status, quotes: filteredQuotes });
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File) {
    if (!isEditing) {
      setError("Please save the review as a draft first before uploading an image.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const updated = await uploadCoverImage(review.id, file);
      setCoverImageUrl(updated.coverImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Book title or review title"
          maxLength={200}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <CoverImageUpload
        currentUrl={coverImageUrl}
        onUpload={handleImageUpload}
        uploading={uploading}
      />

      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`px-4 py-2 text-sm font-medium ${
            !showPreview
              ? "border-b-2 border-gray-900 text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`px-4 py-2 text-sm font-medium ${
            showPreview
              ? "border-b-2 border-gray-900 text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Preview
        </button>
      </div>

      {showPreview ? (
        <div className="min-h-[400px] rounded-md border border-gray-200 bg-white p-4">
          {body ? (
            <MarkdownPreview content={body} />
          ) : (
            <p className="text-gray-400">Nothing to preview</p>
          )}
        </div>
      ) : (
        <MarkdownEditor value={body} onChange={setBody} />
      )}

      <QuoteList quotes={quotes} onChange={setQuotes} />

      <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={() => handleSave("Draft")}
          disabled={saving || !title.trim() || !body.trim()}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          type="button"
          onClick={() => handleSave("Published")}
          disabled={saving || !title.trim() || !body.trim()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? "Publishing..." : "Publish"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
