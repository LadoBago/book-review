import { PagedResult, ReviewDto, ReviewPublicDto, ReviewStatus, ReviewSummaryDto } from "@/types/review";

const isServer = typeof window === "undefined";

// Server-side: direct backend URL. Client-side: empty (uses Next.js rewrites for public).
const PUBLIC_API_BASE = isServer
  ? process.env.API_INTERNAL_URL || "http://localhost:5000"
  : "";

// Client-side authenticated calls go through server-side proxy (never exposes tokens to browser).
// Server-side authenticated calls go directly to backend with injected auth header.
const AUTH_API_BASE = isServer
  ? process.env.API_INTERNAL_URL || "http://localhost:5000"
  : "/api/proxy";

async function fetchApi<T>(
  path: string,
  options?: RequestInit & { skipContentType?: boolean; authenticated?: boolean }
): Promise<T> {
  const { skipContentType, authenticated, ...fetchOptions } = options ?? {};

  let base: string;
  if (authenticated) {
    base = AUTH_API_BASE;
    if (isServer) {
      // Server-side: inject auth header from encrypted JWT cookie
      const { getServerTokens } = await import("@/lib/auth");
      const { accessToken } = await getServerTokens();
      if (accessToken) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Bearer ${accessToken}`,
        };
      }
    }
    // Client-side: proxy route injects auth header automatically
  } else {
    base = PUBLIC_API_BASE;
  }

  const res = await fetch(`${base}${path}`, {
    ...fetchOptions,
    headers: {
      ...(skipContentType ? {} : { "Content-Type": "application/json" }),
      ...fetchOptions?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href =
        "/api/auth/signin?callbackUrl=" +
        encodeURIComponent(window.location.pathname);
      throw new Error("Session expired. Redirecting to login...");
    }
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

// Public endpoints
export async function getPublishedReviews(
  page = 1,
  pageSize = 10,
  search?: string
): Promise<PagedResult<ReviewSummaryDto>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (search) params.set("search", search);

  return fetchApi(`/api/reviews?${params}`);
}

export async function getReviewBySlug(slug: string): Promise<ReviewPublicDto> {
  return fetchApi(`/api/reviews/${encodeURIComponent(slug)}`);
}

// Authenticated endpoints
export async function getMyReviews(
  page = 1,
  pageSize = 10
): Promise<PagedResult<ReviewSummaryDto>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  return fetchApi(`/api/reviews/my?${params}`, { authenticated: true });
}

export async function getReviewById(id: string): Promise<ReviewDto> {
  return fetchApi(`/api/reviews/by-id/${id}`, { authenticated: true });
}

export async function createReview(data: {
  title: string;
  body: string;
  status: ReviewStatus;
  quotes: string[];
}): Promise<ReviewDto> {
  return fetchApi("/api/reviews", {
    method: "POST",
    body: JSON.stringify(data),
    authenticated: true,
  });
}

export async function updateReview(
  id: string,
  data: {
    title?: string;
    body?: string;
    status?: ReviewStatus;
    quotes?: string[];
  }
): Promise<ReviewDto> {
  return fetchApi(`/api/reviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    authenticated: true,
  });
}

export async function deleteReview(id: string): Promise<void> {
  await fetchApi(`/api/reviews/${id}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export async function publishReview(id: string): Promise<ReviewDto> {
  return fetchApi(`/api/reviews/${id}/publish`, {
    method: "POST",
    authenticated: true,
  });
}

export async function unpublishReview(id: string): Promise<ReviewDto> {
  return fetchApi(`/api/reviews/${id}/unpublish`, {
    method: "POST",
    authenticated: true,
  });
}

export async function discardDraft(id: string): Promise<ReviewDto> {
  return fetchApi(`/api/reviews/${id}/draft`, {
    method: "DELETE",
    authenticated: true,
  });
}

// Admin moderation endpoints
export async function getPendingReviews(
  page = 1,
  pageSize = 10
): Promise<PagedResult<ReviewSummaryDto>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  return fetchApi(`/api/moderation/pending?${params}`, { authenticated: true });
}

export async function getModerationReviewById(
  id: string
): Promise<ReviewDto> {
  return fetchApi(`/api/moderation/reviews/${id}`, { authenticated: true });
}

export async function approveReview(id: string): Promise<ReviewDto> {
  return fetchApi(`/api/moderation/reviews/${id}/approve`, {
    method: "POST",
    authenticated: true,
  });
}

export async function rejectReview(
  id: string,
  reason: string
): Promise<ReviewDto> {
  return fetchApi(`/api/moderation/reviews/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
    authenticated: true,
  });
}

export async function uploadCoverImage(
  id: string,
  file: File
): Promise<ReviewDto> {
  const formData = new FormData();
  formData.append("file", file);

  return fetchApi(`/api/reviews/${id}/cover`, {
    method: "POST",
    body: formData,
    skipContentType: true,
    authenticated: true,
  });
}

export async function deleteCoverImage(id: string): Promise<ReviewDto> {
  return fetchApi(`/api/reviews/${id}/cover`, {
    method: "DELETE",
    authenticated: true,
  });
}
