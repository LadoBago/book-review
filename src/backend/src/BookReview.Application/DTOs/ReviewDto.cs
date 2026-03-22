namespace BookReview.Application.DTOs;

public class ReviewDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public string? CoverImageUrl { get; init; }
    public string Slug { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string AuthorId { get; init; } = string.Empty;
    public string AuthorName { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public List<QuoteDto> Quotes { get; init; } = [];
}
