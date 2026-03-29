"use client";

import { useTranslations } from "next-intl";

interface QuoteListProps {
  quotes: string[];
  onChange: (quotes: string[]) => void;
}

export default function QuoteList({ quotes, onChange }: QuoteListProps) {
  const t = useTranslations("editor");

  function addQuote() {
    onChange([...quotes, ""]);
  }

  function updateQuote(index: number, value: string) {
    const updated = [...quotes];
    updated[index] = value;
    onChange(updated);
  }

  function removeQuote(index: number) {
    onChange(quotes.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {t("quotesLabel")}
      </label>
      <div className="space-y-2">
        {quotes.map((quote, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={quote}
              onChange={(e) => updateQuote(index, e.target.value)}
              placeholder={t("quotePlaceholder", { number: index + 1 })}
              maxLength={500}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => removeQuote(index)}
              className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              {t("removeQuote")}
            </button>
          </div>
        ))}
      </div>
      {quotes.length < 50 && (
        <button
          type="button"
          onClick={addQuote}
          className="mt-2 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          {t("addQuote")}
        </button>
      )}
    </div>
  );
}
