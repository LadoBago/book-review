import { auth } from "@/lib/auth";
import { PagedResult, ReviewDto, ReviewSummaryDto } from "@/types/review";

const API_BASE =
  typeof window === "undefined"
    ? process.env.API_INTERNAL_URL || "http://localhost:5000"
    : "";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
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

export async function getReviewBySlug(slug: string): Promise<ReviewDto> {
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
  status: string;
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
    status?: string;
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
  const res = await fetch(`${API_BASE}/api/reviews/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
}

export async function uploadCoverImage(
  id: string,
  file: File
): Promise<ReviewDto> {
  const authHeaders = await getAuthHeaders();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/reviews/${id}/cover`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}
