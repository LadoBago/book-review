"use client";

import { useRef } from "react";

interface CoverImageUploadProps {
  currentUrl: string | null;
  onUpload: (file: File) => void;
  uploading?: boolean;
}

export default function CoverImageUpload({
  currentUrl,
  onUpload,
  uploading = false,
}: CoverImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Cover Image
      </label>
      {currentUrl && (
        <div className="mb-2 overflow-hidden rounded-md border border-gray-200">
          <img
            src={currentUrl}
            alt="Cover preview"
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
          disabled={uploading}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : currentUrl ? "Change Image" : "Upload Image"}
        </button>
        <span className="text-xs text-gray-500">JPEG, PNG, or WebP (max 5MB)</span>
      </div>
    </div>
  );
}
