"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { createReview, updateReview, uploadCoverImage, discardDraft } from "@/lib/api";
import { ReviewDto, ReviewStatus } from "@/types/review";
import MarkdownEditor from "./MarkdownEditor";
import MarkdownPreview from "./MarkdownPreview";
import CoverImageUpload from "./CoverImageUpload";
import QuoteList from "./QuoteList";

interface ReviewFormProps {
  review?: ReviewDto;
}

interface FormState {
  title: string;
  body: string;
  quotes: string[];
  coverImageUrl: string | null;
  showPreview: boolean;
  saving: boolean;
  uploading: boolean;
  discarding: boolean;
  error: string | null;
}

type FormAction =
  | { type: "SET_FIELD"; field: "title" | "body"; value: string }
  | { type: "SET_QUOTES"; quotes: string[] }
  | { type: "SET_COVER_URL"; url: string | null }
  | { type: "TOGGLE_PREVIEW"; show: boolean }
  | { type: "SET_LOADING"; operation: "saving" | "uploading" | "discarding"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_QUOTES":
      return { ...state, quotes: action.quotes };
    case "SET_COVER_URL":
      return { ...state, coverImageUrl: action.url };
    case "TOGGLE_PREVIEW":
      return { ...state, showPreview: action.show };
    case "SET_LOADING":
      return { ...state, [action.operation]: action.loading, error: action.loading ? null : state.error };
    case "SET_ERROR":
      return { ...state, error: action.error };
  }
}

function initFormState(review?: ReviewDto): FormState {
  const hasDraft = review?.hasDraft ?? false;
  return {
    title: (hasDraft ? review?.draftTitle : review?.title) || "",
    body: (hasDraft ? review?.draftBody : review?.body) || "",
    quotes: hasDraft
      ? review?.draftQuotes || []
      : review?.quotes.map((q) => q.text) || [],
    coverImageUrl: review?.coverImageUrl || null,
    showPreview: false,
    saving: false,
    uploading: false,
    discarding: false,
    error: null,
  };
}

export default function ReviewForm({ review }: ReviewFormProps) {
  const router = useRouter();
  const isEditing = !!review;
  const isPublished = review?.status === ReviewStatus.Published;
  const hasDraft = review?.hasDraft ?? false;

  const [state, dispatch] = useReducer(formReducer, review, initFormState);
  const { title, body, quotes, coverImageUrl, showPreview, saving, uploading, discarding, error } = state;

  async function handleSave(status: ReviewStatus) {
    dispatch({ type: "SET_LOADING", operation: "saving", loading: true });
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
      dispatch({ type: "SET_ERROR", error: err instanceof Error ? err.message : "Failed to save review" });
    } finally {
      dispatch({ type: "SET_LOADING", operation: "saving", loading: false });
    }
  }

  async function handleDiscardDraft() {
    if (!review) return;
    dispatch({ type: "SET_LOADING", operation: "discarding", loading: true });
    try {
      await discardDraft(review.id);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: err instanceof Error ? err.message : "Failed to discard draft" });
    } finally {
      dispatch({ type: "SET_LOADING", operation: "discarding", loading: false });
    }
  }

  async function handleImageUpload(file: File) {
    if (!isEditing) {
      dispatch({ type: "SET_ERROR", error: "Please save the review as a draft first before uploading an image." });
      return;
    }
    dispatch({ type: "SET_LOADING", operation: "uploading", loading: true });
    try {
      const updated = await uploadCoverImage(review.id, file);
      dispatch({ type: "SET_COVER_URL", url: updated.coverImageUrl });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: err instanceof Error ? err.message : "Failed to upload image" });
    } finally {
      dispatch({ type: "SET_LOADING", operation: "uploading", loading: false });
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
          onChange={(e) => dispatch({ type: "SET_FIELD", field: "title", value: e.target.value })}
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
          onClick={() => dispatch({ type: "TOGGLE_PREVIEW", show: false })}
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
          onClick={() => dispatch({ type: "TOGGLE_PREVIEW", show: true })}
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
        <MarkdownEditor value={body} onChange={(v) => dispatch({ type: "SET_FIELD", field: "body", value: v })} />
      )}

      <QuoteList quotes={quotes} onChange={(q) => dispatch({ type: "SET_QUOTES", quotes: q })} />

      <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={() => handleSave(ReviewStatus.Draft)}
          disabled={saving || !title.trim() || !body.trim()}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? "Saving..." : isPublished ? "Save Draft Revision" : "Save Draft"}
        </button>
        <button
          type="button"
          onClick={() => handleSave(ReviewStatus.Published)}
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
