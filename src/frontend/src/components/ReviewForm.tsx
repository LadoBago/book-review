"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReview, updateReview, uploadCoverImage, discardDraft } from "@/lib/api";
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
  const isPublished = review?.status === "Published";
  const hasDraft = review?.hasDraft ?? false;

  // When editing a published review with a draft, load draft content
  const initialTitle = (hasDraft ? review?.draftTitle : review?.title) || "";
  const initialBody = (hasDraft ? review?.draftBody : review?.body) || "";
  const initialQuotes = hasDraft
    ? review?.draftQuotes || []
    : review?.quotes.map((q) => q.text) || [];

  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [quotes, setQuotes] = useState<string[]>(initialQuotes);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    review?.coverImageUrl || null
  );
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [discarding, setDiscarding] = useState(false);
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

  async function handleDiscardDraft() {
    if (!review) return;
    setError(null);
    setDiscarding(true);
    try {
      await discardDraft(review.id);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to discard draft");
    } finally {
      setDiscarding(false);
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
      {isPublished && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {hasDraft
            ? "You are editing a draft revision. The published version remains live until you publish this draft."
            : "This review is published. Saving as draft will create a separate draft revision without affecting the live version."}
        </div>
      )}

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
          {saving ? "Saving..." : isPublished ? "Save Draft Revision" : "Save Draft"}
        </button>
        <button
          type="button"
          onClick={() => handleSave("Published")}
          disabled={saving || !title.trim() || !body.trim()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? "Publishing..." : "Publish"}
        </button>
        {hasDraft && (
          <button
            type="button"
            onClick={handleDiscardDraft}
            disabled={discarding}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {discarding ? "Discarding..." : "Discard Draft"}
          </button>
        )}
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
