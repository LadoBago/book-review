namespace BookReview.Domain.Entities;

public class Quote
{
    public Guid Id { get; private set; }
    public string Text { get; private set; } = string.Empty;
    public Guid ReviewId { get; private set; }
    public int SortOrder { get; private set; }

    private Quote() { }

    public Quote(string text, Guid reviewId, int sortOrder = 0)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new Exceptions.DomainException("Quote text cannot be empty.");

        Id = Guid.NewGuid();
        Text = text.Trim();
        ReviewId = reviewId;
        SortOrder = sortOrder;
    }

    public void UpdateText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new Exceptions.DomainException("Quote text cannot be empty.");

        Text = text.Trim();
    }
}
