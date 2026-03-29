using BookReview.Application.DTOs;
using BookReview.Application.Interfaces;
using BookReview.Application.Mapping;
using BookReview.Domain.Entities;
using BookReview.Domain.Exceptions;
using BookReview.Domain.Repositories;

namespace BookReview.Application.Services;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviewRepository;
    private readonly IStorageService _storageService;

    public ReviewService(IReviewRepository reviewRepository, IStorageService storageService)
    {
        _reviewRepository = reviewRepository;
        _storageService = storageService;
    }

    public async Task<ReviewDto> GetByIdAsync(Guid id, string authorId, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.AuthorId != authorId)
            throw new ForbiddenException("You can only view your own reviews.");

        return review.ToDto();
    }

    public async Task<ReviewPublicDto> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetBySlugAsync(slug, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.Status != ReviewStatus.Published)
            throw new NotFoundException("Review not found.");

        return review.ToPublicDto();
    }

    public async Task<PagedResult<ReviewSummaryDto>> GetPublishedAsync(
        int page, int pageSize, string? searchTerm = null, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _reviewRepository.GetPagedAsync(
            page, pageSize, searchTerm, ReviewStatus.Published, cancellationToken: cancellationToken);

        return new PagedResult<ReviewSummaryDto>
        {
            Items = items.Select(r => r.ToSummaryDto()).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult<ReviewSummaryDto>> GetByAuthorAsync(
        string authorId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _reviewRepository.GetPagedAsync(
            page, pageSize, authorId: authorId, cancellationToken: cancellationToken);

        return new PagedResult<ReviewSummaryDto>
        {
            Items = items.Select(r => r.ToSummaryDto()).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ReviewDto> CreateAsync(
        CreateReviewRequest request, string authorId, string authorName, CancellationToken cancellationToken = default)
    {
        var review = new Review(request.Title, request.Body, authorId, authorName, request.Quotes);

        if (request.Status == nameof(ReviewStatus.Published))
            review.SubmitForReview();

        await _reviewRepository.AddAsync(review, cancellationToken);

        return review.ToDto();
    }

    public async Task<ReviewDto> UpdateAsync(
        Guid id, UpdateReviewRequest request, string authorId, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.AuthorId != authorId)
            throw new ForbiddenException("You can only edit your own reviews.");

        var targetStatus = request.Status ?? review.Status.ToString();
        var title = request.Title ?? review.DraftTitle ?? review.Title;
        var body = request.Body ?? review.DraftBody ?? review.Body;
        var quotes = request.Quotes;

        if (review.Status == ReviewStatus.Published)
        {
            // Always save as draft revision — publishing goes through
            // PublishAsync (moderation) or PublishDirectAsync (admin)
            review.SaveDraftRevision(title, body, quotes?.ToList());
        }
        else
        {
            review.UpdateContent(title, body, quotes);

            if (targetStatus == nameof(ReviewStatus.Published))
                review.SubmitForReview();
        }

        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }

    public async Task DeleteAsync(Guid id, string authorId, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.AuthorId != authorId)
            throw new ForbiddenException("You can only delete your own reviews.");

        if (review.Status == ReviewStatus.Published)
            throw new DomainException("You must unpublish the review before deleting it.");

        await _reviewRepository.DeleteAsync(review, cancellationToken);
    }

    public async Task<ReviewDto> PublishAsync(
        Guid id, string authorId, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.AuthorId != authorId)
            throw new ForbiddenException("You can only edit your own reviews.");

        if (review.Status == ReviewStatus.Published)
        {
            // Non-admin: published review with draft goes to moderation queue.
            // The live version stays up. Admin approves via PublishDirectAsync.
            if (!review.HasDraft)
                throw new DomainException("No changes to submit for review.");
        }
        else
        {
            review.SubmitForReview();
        }

        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }

    private async Task CleanupOldCoverOnPublish(Review review, CancellationToken cancellationToken)
    {
        var draftCoverUrl = review.DraftCoverImageUrl;
        if (draftCoverUrl == null) return; // no cover change

        var oldCoverUrl = review.CoverImageUrl;
        if (draftCoverUrl == string.Empty)
        {
            // Clearing cover image — delete old blob
            if (oldCoverUrl != null)
                await _storageService.DeleteImageAsync(oldCoverUrl, cancellationToken);
        }
        else if (oldCoverUrl != null && oldCoverUrl != draftCoverUrl)
        {
            // Replacing cover image — delete old blob
            await _storageService.DeleteImageAsync(oldCoverUrl, cancellationToken);
        }
    }

    public async Task<ReviewDto> UnpublishAsync(
        Guid id, string authorId, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.AuthorId != authorId)
            throw new ForbiddenException("You can only edit your own reviews.");

        review.Unpublish();
        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }

    public async Task<ReviewDto> DiscardDraftAsync(
        Guid id, string authorId, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.AuthorId != authorId)
            throw new ForbiddenException("You can only edit your own reviews.");

        // Delete draft cover image blob if it differs from the live one
        var draftCoverUrl = review.DraftCoverImageUrl;
        if (!string.IsNullOrEmpty(draftCoverUrl) && draftCoverUrl != review.CoverImageUrl)
            await _storageService.DeleteImageAsync(draftCoverUrl, cancellationToken);

        review.DiscardDraft();
        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }

    public async Task<ReviewDto> UploadCoverImageAsync(
        Guid id, Stream imageStream, string fileName, string authorId, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.AuthorId != authorId)
            throw new ForbiddenException("You can only upload images for your own reviews.");

        var url = await _storageService.UploadImageAsync(imageStream, $"{id}/{fileName}", cancellationToken);

        if (review.Status == ReviewStatus.Published)
        {
            // Delete previous draft cover image blob if replacing
            if (!string.IsNullOrEmpty(review.DraftCoverImageUrl))
                await _storageService.DeleteImageAsync(review.DraftCoverImageUrl, cancellationToken);

            review.SetDraftCoverImageUrl(url);
        }
        else
        {
            review.SetCoverImageUrl(url);
        }

        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }

    public async Task<ReviewDto> DeleteCoverImageAsync(
        Guid id, string authorId, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        if (review.AuthorId != authorId)
            throw new ForbiddenException("You can only modify your own reviews.");

        if (review.Status == ReviewStatus.Published)
        {
            // Delete draft cover image blob if one exists
            if (!string.IsNullOrEmpty(review.DraftCoverImageUrl))
                await _storageService.DeleteImageAsync(review.DraftCoverImageUrl, cancellationToken);

            review.ClearDraftCoverImageUrl();
            await _reviewRepository.UpdateAsync(review, cancellationToken);
        }
        else if (review.CoverImageUrl != null)
        {
            await _storageService.DeleteImageAsync(review.CoverImageUrl, cancellationToken);
            review.ClearCoverImageUrl();
            await _reviewRepository.UpdateAsync(review, cancellationToken);
        }

        return review.ToDto();
    }
}
