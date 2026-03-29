using BookReview.Application.DTOs;
using BookReview.Application.Interfaces;
using BookReview.Application.Services;
using BookReview.Domain.Entities;
using BookReview.Domain.Exceptions;
using BookReview.Domain.Repositories;
using NSubstitute;

namespace BookReview.Application.Tests;

public class ReviewServiceTests
{
    private readonly IReviewRepository _repository;
    private readonly IStorageService _storageService;
    private readonly ReviewService _service;

    public ReviewServiceTests()
    {
        _repository = Substitute.For<IReviewRepository>();
        _storageService = Substitute.For<IStorageService>();
        _service = new ReviewService(_repository, _storageService);
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_ReturnsReviewDto()
    {
        var request = new CreateReviewRequest
        {
            Title = "Test Review",
            Body = "Some body",
            Status = "Draft",
            Quotes = ["Quote 1", "Quote 2"]
        };

        var result = await _service.CreateAsync(request, "user-1", "John");

        Assert.Equal("Test Review", result.Title);
        Assert.Equal("Some body", result.Body);
        Assert.Equal("Draft", result.Status);
        Assert.Equal(2, result.Quotes.Count);
        await _repository.Received(1).AddAsync(Arg.Any<Review>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateAsync_WithPublishStatus_SubmitsForReview()
    {
        var request = new CreateReviewRequest
        {
            Title = "Test Review",
            Body = "Some body",
            Status = "Published"
        };

        var result = await _service.CreateAsync(request, "user-1", "John");

        Assert.Equal("PendingReview", result.Status);
    }

    [Fact]
    public async Task GetByIdAsync_NotFound_ThrowsDomainException()
    {
        _repository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((Review?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetByIdAsync(Guid.NewGuid(), "user-1"));
    }

    [Fact]
    public async Task GetBySlugAsync_PublishedReview_ReturnsDto()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();
        _repository.GetBySlugAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(review);

        var result = await _service.GetBySlugAsync("title-abc123");

        Assert.Equal("Title", result.Title);
    }

    [Fact]
    public async Task GetBySlugAsync_DraftReview_ThrowsNotFoundException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetBySlugAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(review);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetBySlugAsync("title-abc123"));
    }

    [Fact]
    public async Task UpdateAsync_DifferentAuthor_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var request = new UpdateReviewRequest { Title = "New Title" };

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.UpdateAsync(review.Id, request, "user-2"));
    }

    [Fact]
    public async Task UpdateAsync_SameAuthor_UpdatesReview()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var request = new UpdateReviewRequest { Title = "Updated Title", Body = "Updated Body" };

        var result = await _service.UpdateAsync(review.Id, request, "user-1");

        Assert.Equal("Updated Title", result.Title);
        Assert.Equal("Updated Body", result.Body);
        await _repository.Received(1).UpdateAsync(Arg.Any<Review>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_PublishDraft_SubmitsForReview()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var request = new UpdateReviewRequest { Status = "Published" };

        var result = await _service.UpdateAsync(review.Id, request, "user-1");

        Assert.Equal("PendingReview", result.Status);
    }

    [Fact]
    public async Task DeleteAsync_DifferentAuthor_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.DeleteAsync(review.Id, "user-2"));
    }

    [Fact]
    public async Task DeleteAsync_SameAuthor_DeletesReview()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        await _service.DeleteAsync(review.Id, "user-1");

        await _repository.Received(1).DeleteAsync(review, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetPublishedAsync_ReturnsPaged()
    {
        var reviews = new List<Review>
        {
            new("Title 1", "Body 1", "user-1", "John"),
            new("Title 2", "Body 2", "user-1", "John")
        };
        reviews[0].Publish();
        reviews[1].Publish();

        _repository.GetPagedAsync(1, 10, null, ReviewStatus.Published, null, Arg.Any<CancellationToken>())
            .Returns((reviews.AsReadOnly() as IReadOnlyList<Review>, 2));

        var result = await _service.GetPublishedAsync(1, 10);

        Assert.Equal(2, result.Items.Count);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(1, result.Page);
    }

    [Fact]
    public async Task UploadCoverImageAsync_DifferentAuthor_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        using var stream = new MemoryStream();
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.UploadCoverImageAsync(review.Id, stream, "cover.jpg", "user-2"));
    }

    // --- PublishAsync tests ---

    [Fact]
    public async Task PublishAsync_DraftReview_SubmitsForReview()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var result = await _service.PublishAsync(review.Id, "user-1");

        Assert.Equal("PendingReview", result.Status);
        await _repository.Received(1).UpdateAsync(review, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task PublishAsync_PublishedReviewWithDraft_KeepsDraftForModeration()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();
        review.SaveDraftRevision("New Title", "New Body", ["Quote 1"]);
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var result = await _service.PublishAsync(review.Id, "user-1");

        // Non-admin: draft stays, live version unchanged, goes to moderation queue
        Assert.Equal("Published", result.Status);
        Assert.Equal("Title", result.Title);
        Assert.True(result.HasDraft);
        Assert.Equal("New Title", result.DraftTitle);
    }

    [Fact]
    public async Task PublishAsync_AlreadyPublishedNoDraft_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.PublishAsync(review.Id, "user-1"));
    }

    [Fact]
    public async Task PublishAsync_DifferentAuthor_ThrowsForbiddenException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.PublishAsync(review.Id, "user-2"));
    }

    // --- UnpublishAsync tests ---

    [Fact]
    public async Task UnpublishAsync_PublishedReview_UnpublishesAndReturnsDto()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var result = await _service.UnpublishAsync(review.Id, "user-1");

        Assert.Equal("Draft", result.Status);
        await _repository.Received(1).UpdateAsync(review, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UnpublishAsync_DraftReview_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.UnpublishAsync(review.Id, "user-1"));
    }

    [Fact]
    public async Task UnpublishAsync_DifferentAuthor_ThrowsForbiddenException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.UnpublishAsync(review.Id, "user-2"));
    }

    // --- DiscardDraftAsync tests ---

    [Fact]
    public async Task DiscardDraftAsync_ReviewWithDraft_DiscardsAndReturnsDto()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();
        review.SaveDraftRevision("Draft Title", "Draft Body");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var result = await _service.DiscardDraftAsync(review.Id, "user-1");

        Assert.False(result.HasDraft);
        Assert.Null(result.DraftTitle);
        Assert.Null(result.DraftBody);
        await _repository.Received(1).UpdateAsync(review, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DiscardDraftAsync_NoDraft_ThrowsDomainException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        await Assert.ThrowsAsync<DomainException>(() =>
            _service.DiscardDraftAsync(review.Id, "user-1"));
    }

    [Fact]
    public async Task DiscardDraftAsync_DifferentAuthor_ThrowsForbiddenException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();
        review.SaveDraftRevision("Draft Title", "Draft Body");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.DiscardDraftAsync(review.Id, "user-2"));
    }
}
