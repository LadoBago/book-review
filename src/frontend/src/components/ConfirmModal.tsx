"use client";

import { useTranslations } from "next-intl";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmClassName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmClassName = "bg-orange-400 text-white hover:bg-orange-500",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const t = useTranslations("common");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm ${confirmClassName}`}
          >
            {confirmLabel || t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
