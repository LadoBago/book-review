using System.Text.RegularExpressions;

namespace BookReview.Domain.ValueObjects;

public partial record Slug
{
    public string Value { get; }

    private Slug(string value)
    {
        Value = value;
    }

    public static Slug FromTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new Exceptions.DomainException("Title cannot be empty when generating slug.");

        var slug = title.ToLowerInvariant();
        slug = NonAlphanumericOrSpace().Replace(slug, "");
        slug = Whitespace().Replace(slug, "-");
        slug = slug.Trim('-');

        var suffix = Guid.NewGuid().ToString("N")[..6];
        slug = $"{slug}-{suffix}";

        return new Slug(slug);
    }

    public static Slug FromValue(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new Exceptions.DomainException("Slug value cannot be empty.");

        return new Slug(value);
    }

    public override string ToString() => Value;

    [GeneratedRegex("[^a-z0-9\\s-]")]
    private static partial Regex NonAlphanumericOrSpace();

    [GeneratedRegex("\\s+")]
    private static partial Regex Whitespace();
}
