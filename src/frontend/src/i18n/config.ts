export const locales = ["en", "ka"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
