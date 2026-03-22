export interface QuoteDto {
  id: string;
  text: string;
}

export interface ReviewDto {
  id: string;
  title: string;
  body: string;
  coverImageUrl: string | null;
  slug: string;
  status: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  quotes: QuoteDto[];
}

export interface ReviewSummaryDto {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  status: string;
  authorName: string;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
