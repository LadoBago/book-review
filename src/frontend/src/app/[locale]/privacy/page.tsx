import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return {
    title: t("title"),
    alternates: {
      canonical: `https://bookreview.ge/${locale}/privacy`,
      languages: { en: "/en/privacy", ka: "/ka/privacy" },
    },
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">{t("title")}</h1>
      <p className="mb-4 text-sm text-gray-500">{t("lastUpdated")}</p>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t("sections.overview.title")}</h2>
          <p>{t("sections.overview.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t("sections.dataCollected.title")}</h2>
          <p className="mb-2">{t("sections.dataCollected.intro")}</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>{t("sections.dataCollected.items.account")}</li>
            <li>{t("sections.dataCollected.items.content")}</li>
            <li>{t("sections.dataCollected.items.technical")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t("sections.usage.title")}</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>{t("sections.usage.items.provide")}</li>
            <li>{t("sections.usage.items.authenticate")}</li>
            <li>{t("sections.usage.items.improve")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t("sections.thirdParty.title")}</h2>
          <p>{t("sections.thirdParty.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t("sections.cookies.title")}</h2>
          <p>{t("sections.cookies.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t("sections.rights.title")}</h2>
          <p>{t("sections.rights.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t("sections.contact.title")}</h2>
          <p>{t("sections.contact.body")}</p>
        </section>
      </div>
    </div>
  );
}
