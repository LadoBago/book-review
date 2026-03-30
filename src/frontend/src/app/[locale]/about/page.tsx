import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { promises as fs } from "fs";
import path from "path";
import MarkdownPreview from "@/components/MarkdownPreview";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("title"),
    alternates: {
      canonical: `https://bookreview.ge/${locale}/about`,
      languages: { en: "/en/about", ka: "/ka/about" },
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const filePath = path.join(process.cwd(), "content", `about.${locale}.md`);
  const content = await fs.readFile(filePath, "utf-8");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <MarkdownPreview content={content} />
    </div>
  );
}
