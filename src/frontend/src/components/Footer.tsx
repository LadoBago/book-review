import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-sm text-gray-500">
        <span>{t("copyright", { year: 2026 })}</span>
        <Link href="/about" className="text-gray-600 hover:text-green-900">
          {t("about")}
        </Link>
      </div>
    </footer>
  );
}
