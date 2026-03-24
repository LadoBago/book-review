using BookReview.Application.Services;
using BookReview.Domain.Entities;
using BookReview.Domain.Exceptions;
using BookReview.Domain.Repositories;
using NSubstitute;

namespace BookReview.Application.Tests;

public class ModerationServiceTests
{
    private readonly IReviewRepository _repository;
    private readonly ModerationService _service;

    public ModerationServiceTests()
    {
        _repository = Substitute.For<IReviewRepository>();
        _service = new ModerationService(_repository);
    }

    [Fact]
    public async Task GetReviewByIdAsync_ExistingReview_ReturnsDto()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var result = await _service.GetReviewByIdAsync(review.Id);

        Assert.Equal("Title", result.Title);
    }

    [Fact]
    public async Task GetReviewByIdAsync_NotFound_ThrowsNotFoundException()
    {
        _repository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((Review?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetReviewByIdAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task ApproveAsync_PendingReview_ApprovesAndReturnsDto()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SubmitForReview();
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var result = await _service.ApproveAsync(review.Id);

        Assert.Equal("Published", result.Status);
        await _repository.Received(1).UpdateAsync(review, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ApproveAsync_NotFound_ThrowsNotFoundException()
    {
        _repository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((Review?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.ApproveAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task RejectAsync_PendingReview_RejectsWithReasonAndReturnsDto()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.SubmitForReview();
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var result = await _service.RejectAsync(review.Id, "Needs improvement");

        Assert.Equal("Draft", result.Status);
        Assert.Equal("Needs improvement", result.RejectionReason);
        await _repository.Received(1).UpdateAsync(review, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RejectAsync_NotFound_ThrowsNotFoundException()
    {
        _repository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((Review?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.RejectAsync(Guid.NewGuid(), "Reason"));
    }

    [Fact]
    public async Task GetPendingAsync_ReturnsPaged()
    {
        var reviews = new List<Review>
        {
            new("Title 1", "Body 1", "user-1", "John"),
            new("Title 2", "Body 2", "user-2", "Jane")
        };
        reviews[0].SubmitForReview();
        reviews[1].SubmitForReview();

        _repository.GetPagedAsync(1, 10, null, ReviewStatus.PendingReview, null, Arg.Any<CancellationToken>())
            .Returns((reviews.AsReadOnly() as IReadOnlyList<Review>, 2));

        var result = await _service.GetPendingAsync(1, 10);

        Assert.Equal(2, result.Items.Count);
        Assert.Equal(2, result.TotalCount);
    }

    // --- PublishDirectAsync tests ---

    [Fact]
    public async Task PublishDirectAsync_DraftReview_PublishesDirectly()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var result = await _service.PublishDirectAsync(review.Id, "user-1");

        Assert.Equal("Published", result.Status);
        await _repository.Received(1).UpdateAsync(review, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task PublishDirectAsync_DifferentAuthor_ThrowsForbiddenException()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.PublishDirectAsync(review.Id, "user-2"));
    }

    [Fact]
    public async Task PublishDirectAsync_WithDraft_PublishesDraftRevision()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();
        review.SaveDraftRevision("New Title", "New Body");
        _repository.GetByIdAsync(review.Id, Arg.Any<CancellationToken>())
            .Returns(review);

        var result = await _service.PublishDirectAsync(review.Id, "user-1");

        Assert.Equal("Published", result.Status);
        Assert.Equal("New Title", result.Title);
        Assert.False(result.HasDraft);
    }
}
