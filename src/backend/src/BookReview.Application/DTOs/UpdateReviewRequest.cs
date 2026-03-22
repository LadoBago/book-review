namespace BookReview.Application.DTOs;

public class UpdateReviewRequest
{
    public string? Title { get; init; }
    public string? Body { get; init; }
    public string? Status { get; init; }
    public List<string>? Quotes { get; init; }
}
