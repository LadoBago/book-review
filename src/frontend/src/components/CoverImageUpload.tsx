"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface CoverImageUploadProps {
  currentUrl: string | null;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  uploading?: boolean;
  removing?: boolean;
}

export default function CoverImageUpload({
  currentUrl,
  onUpload,
  onRemove,
  uploading = false,
  removing = false,
}: CoverImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const t = useTranslations("editor");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSizeError(null);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSizeError(t("fileSizeError"));
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    onUpload(file);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {t("coverImageLabel")}
      </label>
      {currentUrl && (
        <div className="mb-2 overflow-hidden rounded-md border border-gray-200">
          <img
            src={currentUrl}
            alt={t("coverPreviewAlt")}
            className="h-48 w-full object-cover"
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || removing}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? t("uploading") : currentUrl ? t("changeImage") : t("uploadImage")}
        </button>
        {currentUrl && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading || removing}
            className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {removing ? t("removing") : t("removeImage")}
          </button>
        )}
        <span className="text-xs text-gray-500">{t("imageFormats")}</span>
      </div>
      {sizeError && (
        <p className="mt-1 text-xs text-red-600">{sizeError}</p>
      )}
    </div>
  );
}
