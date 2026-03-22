using BookReview.Domain.Exceptions;
using BookReview.Domain.ValueObjects;

namespace BookReview.Domain.Entities;

public class Review
{
    private readonly List<Quote> _quotes = [];

    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public string? CoverImageUrl { get; private set; }
    public Slug Slug { get; private set; } = null!;
    public ReviewStatus Status { get; private set; }
    public string AuthorId { get; private set; } = string.Empty;
    public string AuthorName { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public IReadOnlyList<Quote> Quotes => _quotes.AsReadOnly();

    public string? DraftTitle { get; private set; }
    public string? DraftBody { get; private set; }
    public List<string>? DraftQuotes { get; private set; }
    public bool HasDraft => DraftTitle != null;

    private Review() { }

    public Review(string title, string body, string authorId, string authorName, IEnumerable<string>? quotes = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Review title cannot be empty.");

        if (string.IsNullOrWhiteSpace(body))
            throw new DomainException("Review body cannot be empty.");

        if (string.IsNullOrWhiteSpace(authorId))
            throw new DomainException("Author ID cannot be empty.");

        Id = Guid.NewGuid();
        Title = title.Trim();
        Body = body;
        Slug = Slug.FromTitle(title);
        Status = ReviewStatus.Draft;
        AuthorId = authorId;
        AuthorName = authorName?.Trim() ?? string.Empty;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;

        if (quotes != null)
        {
            var order = 0;
            foreach (var quote in quotes)
                _quotes.Add(new Quote(quote, Id, order++));
        }
    }

    public void UpdateContent(string title, string body, IEnumerable<string>? quotes = null)
    {
        if (Status == ReviewStatus.Published)
            throw new DomainException("Use SaveDraftRevision to edit a published review.");

        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Review title cannot be empty.");

        if (string.IsNullOrWhiteSpace(body))
            throw new DomainException("Review body cannot be empty.");

        if (title.Trim() != Title)
        {
            Title = title.Trim();
            Slug = Slug.FromTitle(title);
        }

        Body = body;
        UpdatedAt = DateTimeOffset.UtcNow;

        if (quotes != null)
        {
            _quotes.Clear();
            var order = 0;
            foreach (var quote in quotes)
                _quotes.Add(new Quote(quote, Id, order++));
        }
    }

    public void SaveDraftRevision(string title, string body, List<string>? quotes = null)
    {
        if (Status != ReviewStatus.Published)
            throw new DomainException("Only published reviews can have draft revisions.");

        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Review title cannot be empty.");

        if (string.IsNullOrWhiteSpace(body))
            throw new DomainException("Review body cannot be empty.");

        DraftTitle = title.Trim();
        DraftBody = body;
        DraftQuotes = quotes?.Where(q => !string.IsNullOrWhiteSpace(q)).ToList();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void PublishDraftRevision()
    {
        if (!HasDraft)
            throw new DomainException("No draft revision to publish.");

        if (DraftTitle!.Trim() != Title)
        {
            Title = DraftTitle.Trim();
            Slug = Slug.FromTitle(Title);
        }

        Body = DraftBody!;

        _quotes.Clear();
        if (DraftQuotes != null)
        {
            var order = 0;
            foreach (var quote in DraftQuotes)
                _quotes.Add(new Quote(quote, Id, order++));
        }

        DraftTitle = null;
        DraftBody = null;
        DraftQuotes = null;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void DiscardDraft()
    {
        if (!HasDraft)
            throw new DomainException("No draft revision to discard.");

        DraftTitle = null;
        DraftBody = null;
        DraftQuotes = null;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetCoverImageUrl(string url)
    {
        CoverImageUrl = url;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Publish()
    {
        if (Status == ReviewStatus.Published)
            throw new DomainException("Review is already published.");

        Status = ReviewStatus.Published;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Unpublish()
    {
        if (Status == ReviewStatus.Draft)
            throw new DomainException("Review is already a draft.");

        Status = ReviewStatus.Draft;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
