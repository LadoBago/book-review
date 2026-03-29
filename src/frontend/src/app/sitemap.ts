import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

const BASE_URL = "https://bookreview.ge";

async function getAllReviewSlugs(): Promise<
  { slug: string; updatedAt: string }[]
> {
  try {
    const apiBase = process.env.API_INTERNAL_URL || "http://localhost:5000";
    const res = await fetch(`${apiBase}/api/reviews?page=1&pageSize=1000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items.map((r: { slug: string; updatedAt?: string; createdAt: string }) => ({
      slug: r.slug,
      updatedAt: r.updatedAt || r.createdAt,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const reviews = await getAllReviewSlugs();

  const entries: MetadataRoute.Sitemap = [];

  // Home pages per locale
  for (const locale of locales) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    });
  }

  // Review pages per locale
  for (const review of reviews) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/reviews/${review.slug}`,
        lastModified: new Date(review.updatedAt),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
