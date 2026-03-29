using BookReview.Domain.Entities;
using BookReview.Domain.Exceptions;

namespace BookReview.Domain.Tests;

public class ReviewTests
{
    [Fact]
    public void Constructor_ValidParams_CreatesReviewAsDraft()
    {
        var review = new Review("Title", "Body content", "user-1", "John Doe");

        Assert.Equal("Title", review.Title);
        Assert.Equal("Body content", review.Body);
        Assert.Equal("user-1", review.AuthorId);
        Assert.Equal("John Doe", review.AuthorName);
        Assert.Equal(ReviewStatus.Draft, review.Status);
        Assert.NotEqual(Guid.Empty, review.Id);
        Assert.NotNull(review.Slug);
    }

    [Fact]
    public void Constructor_WithQuotes_AddsQuotesToReview()
    {
        var quotes = new[] { "Quote one", "Quote two" };
        var review = new Review("Title", "Body", "user-1", "John", quotes);

        Assert.Equal(2, review.Quotes.Count);
        Assert.Equal("Quote one", review.Quotes[0].Text);
        Assert.Equal("Quote two", review.Quotes[1].Text);
    }

    [Fact]
    public void Constructor_EmptyTitle_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => new Review("", "Body", "user-1", "John"));
    }

    [Fact]
    public void Constructor_EmptyBody_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => new Review("Title", "", "user-1", "John"));
    }

    [Fact]
    public void Constructor_EmptyAuthorId_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => new Review("Title", "Body", "", "John"));
    }

    [Fact]
    public void Publish_DraftReview_ChangesStatusToPublished()
    {
        var review = new Review("Title", "Body", "user-1", "John");

        review.Publish();

        Assert.Equal(ReviewStatus.Published, review.Status);
    }

    [Fact]
    public void Publish_AlreadyPublished_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();

        Assert.Throws<DomainException>(() => review.Publish());
    }

    [Fact]
    public void Publish_PendingReview_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SubmitForReview();

        Assert.Throws<DomainException>(() => review.Publish());
    }

    [Fact]
    public void SubmitForReview_DraftReview_ChangesStatusToPendingReview()
    {
        var review = new Review("Title", "Body", "user-1", "John");

        review.SubmitForReview();

        Assert.Equal(ReviewStatus.PendingReview, review.Status);
    }

    [Fact]
    public void SubmitForReview_AlreadyPublished_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();

        Assert.Throws<DomainException>(() => review.SubmitForReview());
    }

    [Fact]
    public void SubmitForReview_AlreadyPending_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SubmitForReview();

        Assert.Throws<DomainException>(() => review.SubmitForReview());
    }

    [Fact]
    public void Approve_PendingReview_ChangesStatusToPublished()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SubmitForReview();

        review.Approve();

        Assert.Equal(ReviewStatus.Published, review.Status);
    }

    [Fact]
    public void Approve_DraftReview_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");

        Assert.Throws<DomainException>(() => review.Approve());
    }

    [Fact]
    public void Reject_PendingReview_ChangesStatusToDraftWithReason()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SubmitForReview();

        review.Reject("Content needs improvement");

        Assert.Equal(ReviewStatus.Draft, review.Status);
        Assert.Equal("Content needs improvement", review.RejectionReason);
    }

    [Fact]
    public void Reject_EmptyReason_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SubmitForReview();

        Assert.Throws<DomainException>(() => review.Reject(""));
    }

    [Fact]
    public void Reject_ReasonTooLong_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SubmitForReview();

        Assert.Throws<DomainException>(() => review.Reject(new string('a', 501)));
    }

    [Fact]
    public void SubmitForReview_AfterRejection_ClearsRejectionReason()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SubmitForReview();
        review.Reject("Needs work");

        review.SubmitForReview();

        Assert.Equal(ReviewStatus.PendingReview, review.Status);
        Assert.Null(review.RejectionReason);
    }

    [Fact]
    public void Unpublish_PublishedReview_ChangesStatusToDraft()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();

        review.Unpublish();

        Assert.Equal(ReviewStatus.Draft, review.Status);
    }

    [Fact]
    public void Unpublish_DraftReview_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");

        Assert.Throws<DomainException>(() => review.Unpublish());
    }

    [Fact]
    public void UpdateContent_ChangesTitle_RegeneratesSlug()
    {
        var review = new Review("Original Title", "Body", "user-1", "John");
        var originalSlug = review.Slug.Value;

        review.UpdateContent("New Title", "New Body");

        Assert.Equal("New Title", review.Title);
        Assert.Equal("New Body", review.Body);
        Assert.NotEqual(originalSlug, review.Slug.Value);
    }

    [Fact]
    public void UpdateContent_SameTitle_KeepsSlug()
    {
        var review = new Review("Same Title", "Body", "user-1", "John");
        var originalSlug = review.Slug.Value;

        review.UpdateContent("Same Title", "Updated Body");

        Assert.Equal(originalSlug, review.Slug.Value);
    }

    [Fact]
    public void UpdateContent_WithQuotes_ReplacesQuotes()
    {
        var review = new Review("Title", "Body", "user-1", "John", new[] { "Old quote" });

        review.UpdateContent("Title", "Body", new[] { "New quote 1", "New quote 2" });

        Assert.Equal(2, review.Quotes.Count);
        Assert.Equal("New quote 1", review.Quotes[0].Text);
    }

    [Fact]
    public void SetCoverImageUrl_DraftReview_SetsUrlAndUpdatesTimestamp()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        var beforeUpdate = review.UpdatedAt;

        review.SetCoverImageUrl("https://storage.example.com/cover.jpg");

        Assert.Equal("https://storage.example.com/cover.jpg", review.CoverImageUrl);
        Assert.True(review.UpdatedAt >= beforeUpdate);
    }

    [Fact]
    public void SetCoverImageUrl_PublishedReview_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();

        Assert.Throws<DomainException>(() =>
            review.SetCoverImageUrl("https://storage.example.com/cover.jpg"));
    }

    [Fact]
    public void ClearCoverImageUrl_PublishedReview_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SetCoverImageUrl("https://storage.example.com/cover.jpg");
        review.Publish();

        Assert.Throws<DomainException>(() => review.ClearCoverImageUrl());
    }

    [Fact]
    public void SetDraftCoverImageUrl_PublishedReview_SetsDraftField()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();

        review.SetDraftCoverImageUrl("https://storage.example.com/new-cover.jpg");

        Assert.Equal("https://storage.example.com/new-cover.jpg", review.DraftCoverImageUrl);
        Assert.True(review.HasDraft);
    }

    [Fact]
    public void SetDraftCoverImageUrl_PublishedReview_AutoPopulatesTextDraft()
    {
        var review = new Review("Title", "Body", "user-1", "John", ["Quote 1"]);
        review.Publish();

        review.SetDraftCoverImageUrl("https://storage.example.com/new-cover.jpg");

        Assert.Equal("Title", review.DraftTitle);
        Assert.Equal("Body", review.DraftBody);
        Assert.NotNull(review.DraftQuotes);
        Assert.Single(review.DraftQuotes);
    }

    [Fact]
    public void SetDraftCoverImageUrl_DraftReview_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");

        Assert.Throws<DomainException>(() =>
            review.SetDraftCoverImageUrl("https://storage.example.com/cover.jpg"));
    }

    [Fact]
    public void ClearDraftCoverImageUrl_PublishedReview_SetsSentinel()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();

        review.ClearDraftCoverImageUrl();

        Assert.Equal(string.Empty, review.DraftCoverImageUrl);
        Assert.True(review.HasDraft);
    }

    [Fact]
    public void PublishDraftRevision_WithDraftCoverImage_PromotesCoverImage()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();
        review.SaveDraftRevision("Title", "Body");
        review.SetDraftCoverImageUrl("https://storage.example.com/new-cover.jpg");

        review.PublishDraftRevision();

        Assert.Equal("https://storage.example.com/new-cover.jpg", review.CoverImageUrl);
        Assert.Null(review.DraftCoverImageUrl);
    }

    [Fact]
    public void PublishDraftRevision_WithClearedDraftCoverImage_NullsCoverImage()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SetCoverImageUrl("https://storage.example.com/old.jpg");
        review.Publish();
        review.ClearDraftCoverImageUrl();

        review.PublishDraftRevision();

        Assert.Null(review.CoverImageUrl);
        Assert.Null(review.DraftCoverImageUrl);
    }

    [Fact]
    public void PublishDraftRevision_WithNullDraftCoverImage_KeepsExistingCover()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SetCoverImageUrl("https://storage.example.com/old.jpg");
        review.Publish();
        review.SaveDraftRevision("New Title", "New Body");

        review.PublishDraftRevision();

        Assert.Equal("https://storage.example.com/old.jpg", review.CoverImageUrl);
    }

    [Fact]
    public void DiscardDraft_ClearsDraftCoverImageUrl()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();
        review.SetDraftCoverImageUrl("https://storage.example.com/new-cover.jpg");

        review.DiscardDraft();

        Assert.Null(review.DraftCoverImageUrl);
        Assert.False(review.HasDraft);
    }

    [Fact]
    public void HasDraft_OnlyCoverImageDraft_ReturnsTrue()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();

        Assert.False(review.HasDraft);

        review.SetDraftCoverImageUrl("https://storage.example.com/cover.jpg");

        Assert.True(review.HasDraft);
    }
}
