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

    public async Task<ReviewDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        return review.ToDto();
    }

    public async Task<ReviewDto> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var review = await _reviewRepository.GetBySlugAsync(slug, cancellationToken)
            ?? throw new NotFoundException("Review not found.");

        return review.ToDto();
    }

    public async Task<PagedResult<ReviewSummaryDto>> GetPublishedAsync(
        int page, int pageSize, string? searchTerm = null, CancellationToken cancellationToken = default)
    {
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

        if (request.Status == "Published")
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

        if (request.Title != null || request.Body != null || request.Quotes != null)
        {
            review.UpdateContent(
                request.Title ?? review.Title,
                request.Body ?? review.Body,
                request.Quotes);
        }

        if (request.Status != null)
        {
            if (request.Status == "Published" && review.Status == ReviewStatus.Draft)
                review.Publish();
            else if (request.Status == "Draft" && review.Status == ReviewStatus.Published)
                review.Unpublish();
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

        await _reviewRepository.DeleteAsync(review, cancellationToken);
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
