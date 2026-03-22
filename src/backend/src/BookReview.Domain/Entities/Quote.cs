namespace BookReview.Domain.Entities;

public class Quote
{
    public Guid Id { get; private set; }
    public string Text { get; private set; } = string.Empty;
    public Guid ReviewId { get; private set; }

    private Quote() { }

    public Quote(string text, Guid reviewId)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new Exceptions.DomainException("Quote text cannot be empty.");

        Id = Guid.NewGuid();
        Text = text.Trim();
        ReviewId = reviewId;
    }

    public void UpdateText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new Exceptions.DomainException("Quote text cannot be empty.");

        Text = text.Trim();
    }
}
