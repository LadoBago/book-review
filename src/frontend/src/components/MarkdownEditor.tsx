"use client";

import { useTranslations } from "next-intl";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const t = useTranslations("editor");

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {t("bodyLabel")}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={16}
        placeholder={t("bodyPlaceholder")}
        className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
