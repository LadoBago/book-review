namespace BookReview.Application.DTOs;

public class ReviewSummaryDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string? CoverImageUrl { get; init; }
    public string Status { get; init; } = string.Empty;
    public string AuthorName { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; }
    public bool HasDraft { get; init; }
    public string? RejectionReason { get; init; }
}
