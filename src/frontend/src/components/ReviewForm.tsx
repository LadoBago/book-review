"use client";

import { useReducer } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { createReview, updateReview, uploadCoverImage, deleteCoverImage, discardDraft, publishReview } from "@/lib/api";
import { ReviewDto, ReviewStatus } from "@/types/review";
import MarkdownEditor from "./MarkdownEditor";
import MarkdownPreview from "./MarkdownPreview";
import CoverImageUpload from "./CoverImageUpload";
import QuoteList from "./QuoteList";
import { useRouter } from "@/i18n/navigation";

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
  removing: boolean;
  discarding: boolean;
  error: string | null;
}

type FormAction =
  | { type: "SET_FIELD"; field: "title" | "body"; value: string }
  | { type: "SET_QUOTES"; quotes: string[] }
  | { type: "SET_COVER_URL"; url: string | null }
  | { type: "TOGGLE_PREVIEW"; show: boolean }
  | { type: "SET_LOADING"; operation: "saving" | "uploading" | "removing" | "discarding"; loading: boolean }
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
    coverImageUrl: hasDraft
      ? (review?.draftCoverImageUrl === "" ? null : review?.draftCoverImageUrl ?? review?.coverImageUrl ?? null)
      : review?.coverImageUrl || null,
    showPreview: false,
    saving: false,
    uploading: false,
    removing: false,
    discarding: false,
    error: null,
  };
}

export default function ReviewForm({ review }: ReviewFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("editor");
  const tPublish = useTranslations("publish");
  const tErrors = useTranslations("errors");
  const isEditing = !!review;
  const isPublished = review?.status === ReviewStatus.Published;
  const hasDraft = review?.hasDraft ?? false;
  const isAdmin = session?.isAdmin ?? false;

  const [state, dispatch] = useReducer(formReducer, review, initFormState);
  const { title, body, quotes, coverImageUrl, showPreview, saving, uploading, removing, discarding, error } = state;

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
      dispatch({ type: "SET_ERROR", error: err instanceof Error ? err.message : tErrors("failedToSave") });
    } finally {
      dispatch({ type: "SET_LOADING", operation: "saving", loading: false });
    }
  }

  async function handlePublishDirect() {
    dispatch({ type: "SET_LOADING", operation: "saving", loading: true });
    try {
      const filteredQuotes = quotes.filter((q) => q.trim() !== "");
      let reviewId = review?.id;
      if (isEditing) {
        await updateReview(review.id, { title, body, status: ReviewStatus.Draft, quotes: filteredQuotes });
      } else {
        const created = await createReview({ title, body, status: ReviewStatus.Draft, quotes: filteredQuotes });
        reviewId = created.id;
      }
      await publishReview(reviewId!);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: err instanceof Error ? err.message : tErrors("failedToPublish") });
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
      dispatch({ type: "SET_ERROR", error: err instanceof Error ? err.message : tErrors("failedToDiscard") });
    } finally {
      dispatch({ type: "SET_LOADING", operation: "discarding", loading: false });
    }
  }

  async function handleImageUpload(file: File) {
    if (!isEditing) {
      dispatch({ type: "SET_ERROR", error: t("saveFirstError") });
      return;
    }
    dispatch({ type: "SET_LOADING", operation: "uploading", loading: true });
    try {
      const updated = await uploadCoverImage(review.id, file);
      const url = updated.draftCoverImageUrl != null && updated.draftCoverImageUrl !== ""
        ? updated.draftCoverImageUrl
        : updated.coverImageUrl;
      dispatch({ type: "SET_COVER_URL", url });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: err instanceof Error ? err.message : tErrors("failedToUpload") });
    } finally {
      dispatch({ type: "SET_LOADING", operation: "uploading", loading: false });
    }
  }

  async function handleImageRemove() {
    if (!isEditing) return;
    dispatch({ type: "SET_LOADING", operation: "removing", loading: true });
    try {
      await deleteCoverImage(review.id);
      dispatch({ type: "SET_COVER_URL", url: null });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: err instanceof Error ? err.message : tErrors("failedToRemoveImage") });
    } finally {
      dispatch({ type: "SET_LOADING", operation: "removing", loading: false });
    }
  }

  return (
    <div className="space-y-6">
      {isPublished && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {hasDraft ? t("publishedHasDraft") : t("publishedNoDraft")}
        </div>
      )}

      {review?.rejectionReason && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>{t("rejectedLabel")}</strong> {review.rejectionReason}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t("titleLabel")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => dispatch({ type: "SET_FIELD", field: "title", value: e.target.value })}
          placeholder={t("titlePlaceholder")}
          maxLength={200}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {title.length > 0 && title.trim().length < 3 && (
          <p className="mt-1 text-xs text-amber-600">{t("titleHint")}</p>
        )}
      </div>

      <CoverImageUpload
        currentUrl={coverImageUrl}
        onUpload={handleImageUpload}
        onRemove={isEditing ? handleImageRemove : undefined}
        uploading={uploading}
        removing={removing}
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
          {t("write")}
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
          {t("preview")}
        </button>
      </div>

      {showPreview ? (
        <div className="min-h-[400px] rounded-md border border-gray-200 bg-white p-4">
          {body ? (
            <MarkdownPreview content={body} />
          ) : (
            <p className="text-gray-400">{t("nothingToPreview")}</p>
          )}
        </div>
      ) : (
        <MarkdownEditor value={body} onChange={(v) => dispatch({ type: "SET_FIELD", field: "body", value: v })} />
      )}
      {body.length > 0 && body.trim().length < 10 && (
        <p className="text-xs text-amber-600">{t("bodyHint")}</p>
      )}

      <QuoteList quotes={quotes} onChange={(q) => dispatch({ type: "SET_QUOTES", quotes: q })} />

      <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={() => handleSave(ReviewStatus.Draft)}
          disabled={saving || title.trim().length < 3 || body.trim().length < 10}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? t("saving") : isPublished ? t("saveDraftRevision") : t("saveDraft")}
        </button>
        {isAdmin ? (
          <button
            type="button"
            onClick={handlePublishDirect}
            disabled={saving || title.trim().length < 3 || body.trim().length < 10}
            className="rounded-md bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? tPublish("publishing") : tPublish("publish")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSave(ReviewStatus.Published)}
            disabled={saving || title.trim().length < 3 || body.trim().length < 10}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? t("submitting") : t("submitForReview")}
          </button>
        )}
        {hasDraft && (
          <button
            type="button"
            onClick={handleDiscardDraft}
            disabled={discarding}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {discarding ? t("discarding") : t("discardDraft")}
          </button>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
