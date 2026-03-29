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
    private readonly IStorageService _storageService;

    public ModerationService(IReviewRepository reviewRepository, IStorageService storageService)
    {
        _reviewRepository = reviewRepository;
        _storageService = storageService;
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

        // Includes both PendingReview reviews and Published reviews with pending drafts
        var (items, totalCount) = await _reviewRepository.GetPendingModerationAsync(
            page, pageSize, cancellationToken);

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

        if (review.Status == ReviewStatus.Published && review.HasDraft)
        {
            // Published review with pending draft — approve by publishing the draft
            await CleanupOldCoverOnPublish(review, cancellationToken);
            review.PublishDraftRevision();
        }
        else
        {
            review.Approve();
        }

        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }

    public async Task<ReviewDto> RejectAsync(Guid id, string reason, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.Status == ReviewStatus.Published && review.HasDraft)
        {
            // Published review with pending draft — keep draft, set rejection reason
            review.SetRejectionReason(reason);
        }
        else
        {
            review.Reject(reason);
        }

        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }

    private async Task CleanupOldCoverOnPublish(Review review, CancellationToken cancellationToken)
    {
        var draftCoverUrl = review.DraftCoverImageUrl;
        if (draftCoverUrl == null) return;

        var oldCoverUrl = review.CoverImageUrl;
        if (draftCoverUrl == string.Empty)
        {
            if (oldCoverUrl != null)
                await _storageService.DeleteImageAsync(oldCoverUrl, cancellationToken);
        }
        else if (oldCoverUrl != null && oldCoverUrl != draftCoverUrl)
        {
            await _storageService.DeleteImageAsync(oldCoverUrl, cancellationToken);
        }
    }

    public async Task<ReviewDto> PublishDirectAsync(Guid id, string authorId, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.AuthorId != authorId)
            throw new ForbiddenException("You can only publish your own reviews.");

        if (review.HasDraft)
        {
            // Clean up old cover image blob if being replaced
            var draftCoverUrl = review.DraftCoverImageUrl;
            if (draftCoverUrl != null)
            {
                var oldCoverUrl = review.CoverImageUrl;
                if (draftCoverUrl == string.Empty && oldCoverUrl != null)
                    await _storageService.DeleteImageAsync(oldCoverUrl, cancellationToken);
                else if (oldCoverUrl != null && oldCoverUrl != draftCoverUrl)
                    await _storageService.DeleteImageAsync(oldCoverUrl, cancellationToken);
            }

            review.PublishDraftRevision();
        }
        else
        {
            review.Publish();
        }

        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }

    public async Task<ReviewDto> UnpublishAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        review.Unpublish();
        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }
}
