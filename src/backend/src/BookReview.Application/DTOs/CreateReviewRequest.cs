namespace BookReview.Application.DTOs;

public class CreateReviewRequest
{
    public string Title { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public string Status { get; init; } = "Draft";
    public List<string> Quotes { get; init; } = [];
}
