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
            review.Publish();

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
            if (targetStatus == nameof(ReviewStatus.Draft))
            {
                // Save as draft revision — published version stays live
                review.SaveDraftRevision(title, body, quotes?.ToList());
            }
            else
            {
                // Publishing edits: save draft then immediately publish it
                review.SaveDraftRevision(title, body, quotes?.ToList());
                review.PublishDraftRevision();
            }
        }
        else
        {
            // Review is still a draft — update directly
            review.UpdateContent(title, body, quotes);

            if (targetStatus == nameof(ReviewStatus.Published))
                review.Publish();
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

        if (review.HasDraft)
            review.PublishDraftRevision();
        else
            review.Publish();

        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
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
        review.SetCoverImageUrl(url);

        await _reviewRepository.UpdateAsync(review, cancellationToken);

        return review.ToDto();
    }
}
