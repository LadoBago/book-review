using BookReview.Application.DTOs;
using BookReview.Application.Interfaces;
using BookReview.Application.Mapping;
using BookReview.Domain.Entities;
using BookReview.Domain.Exceptions;
using BookReview.Domain.Repositories;

namespace BookReview.Application.Services;

public class ModerationService : IModerationService
{
    private readonly IReviewRepository _reviewRepository;

    public ModerationService(IReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<ReviewDto> GetReviewByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        return review.ToDto();
    }

    public async Task<PagedResult<ReviewSummaryDto>> GetPendingAsync(
        int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _reviewRepository.GetPagedAsync(
            page, pageSize, status: ReviewStatus.PendingReview, cancellationToken: cancellationToken);

        return new PagedResult<ReviewSummaryDto>
        {
            Items = items.Select(r => r.ToSummaryDto()).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ReviewDto> ApproveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        review.Approve();
        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }

    public async Task<ReviewDto> RejectAsync(Guid id, string reason, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        review.Reject(reason);
        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }

    public async Task<ReviewDto> PublishDirectAsync(Guid id, string authorId, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.AuthorId != authorId)
            throw new ForbiddenException("You can only publish your own reviews.");

        if (review.HasDraft)
        {
            review.PublishDraftRevision();
        }
        else
        {
            review.Publish();
        }

        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }
}
