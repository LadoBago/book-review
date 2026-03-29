export const ReviewStatus = {
  Draft: "Draft",
  PendingReview: "PendingReview",
  Published: "Published",
} as const;

export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export interface QuoteDto {
  id: string;
  text: string;
}

export interface ReviewPublicDto {
  id: string;
  title: string;
  body: string;
  coverImageUrl: string | null;
  slug: string;
  status: ReviewStatus;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  quotes: QuoteDto[];
}

export interface ReviewDto extends ReviewPublicDto {
  hasDraft: boolean;
  draftTitle: string | null;
  draftBody: string | null;
  draftQuotes: string[] | null;
  draftCoverImageUrl: string | null;
  rejectionReason: string | null;
}

export interface ReviewSummaryDto {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  status: ReviewStatus;
  authorName: string;
  createdAt: string;
  hasDraft: boolean;
  rejectionReason: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
