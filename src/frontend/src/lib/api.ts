import { auth } from "@/lib/auth";
import { PagedResult, ReviewDto, ReviewPublicDto, ReviewStatus, ReviewSummaryDto } from "@/types/review";

const API_BASE =
  typeof window === "undefined"
    ? process.env.API_INTERNAL_URL || "http://localhost:5000"
    : "";

async function fetchApi<T>(path: string, options?: RequestInit & { skipContentType?: boolean }): Promise<T> {
  const { skipContentType, ...fetchOptions } = options ?? {};
  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: {
      ...(skipContentType ? {} : { "Content-Type": "application/json" }),
      ...fetchOptions?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") {
    // Client-side: fetch token from session endpoint
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    if (session?.accessToken) {
      return { Authorization: `Bearer ${session.accessToken}` };
    }
    return {};
  }

  // Server-side: use next-auth's auth() directly
  const session = await auth();
  if (session?.accessToken) {
    return { Authorization: `Bearer ${session.accessToken}` };
  }
  return {};
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
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  return fetchApi(`/api/reviews/my?${params}`, { headers });
}

export async function getReviewById(id: string): Promise<ReviewDto> {
  const headers = await getAuthHeaders();
  return fetchApi(`/api/reviews/by-id/${id}`, { headers });
}

export async function createReview(data: {
  title: string;
  body: string;
  status: ReviewStatus;
  quotes: string[];
}): Promise<ReviewDto> {
  const headers = await getAuthHeaders();
  return fetchApi("/api/reviews", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
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
  const headers = await getAuthHeaders();
  return fetchApi(`/api/reviews/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
}

export async function deleteReview(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  await fetchApi(`/api/reviews/${id}`, {
    method: "DELETE",
    headers,
  });
}

export async function publishReview(id: string): Promise<ReviewDto> {
  const headers = await getAuthHeaders();
  return fetchApi(`/api/reviews/${id}/publish`, {
    method: "POST",
    headers,
  });
}

export async function unpublishReview(id: string): Promise<ReviewDto> {
  const headers = await getAuthHeaders();
  return fetchApi(`/api/reviews/${id}/unpublish`, {
    method: "POST",
    headers,
  });
}

export async function discardDraft(id: string): Promise<ReviewDto> {
  const headers = await getAuthHeaders();
  return fetchApi(`/api/reviews/${id}/draft`, {
    method: "DELETE",
    headers,
  });
}

export async function uploadCoverImage(
  id: string,
  file: File
): Promise<ReviewDto> {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append("file", file);

  return fetchApi(`/api/reviews/${id}/cover`, {
    method: "POST",
    headers,
    body: formData,
    skipContentType: true,
  });
}
