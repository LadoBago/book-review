using BookReview.Domain.Exceptions;
using BookReview.Domain.ValueObjects;

namespace BookReview.Domain.Tests;

public class SlugTests
{
    [Fact]
    public void FromTitle_ValidTitle_ReturnsSlugWithLowercaseAndHyphens()
    {
        var slug = Slug.FromTitle("The Great Gatsby");

        Assert.StartsWith("the-great-gatsby-", slug.Value);
        Assert.Matches(@"^the-great-gatsby-[a-f0-9]{6}$", slug.Value);
    }

    [Fact]
    public void FromTitle_TitleWithSpecialChars_StripsNonAlphanumeric()
    {
        var slug = Slug.FromTitle("Hello, World! #1");

        Assert.StartsWith("hello-world-1-", slug.Value);
    }

    [Fact]
    public void FromTitle_TitleWithMultipleSpaces_CollapsesToSingleHyphen()
    {
        var slug = Slug.FromTitle("Too   Many   Spaces");

        Assert.StartsWith("too-many-spaces-", slug.Value);
    }

    [Fact]
    public void FromTitle_EmptyTitle_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => Slug.FromTitle(""));
    }

    [Fact]
    public void FromTitle_NullTitle_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => Slug.FromTitle(null!));
    }

    [Fact]
    public void FromTitle_GeneratesUniqueSlugsSuffix()
    {
        var slug1 = Slug.FromTitle("Same Title");
        var slug2 = Slug.FromTitle("Same Title");

        Assert.NotEqual(slug1.Value, slug2.Value);
    }

    [Fact]
    public void FromValue_ValidValue_ReturnsSlug()
    {
        var slug = Slug.FromValue("existing-slug-abc123");

        Assert.Equal("existing-slug-abc123", slug.Value);
    }

    [Fact]
    public void FromValue_EmptyValue_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => Slug.FromValue(""));
    }
}
