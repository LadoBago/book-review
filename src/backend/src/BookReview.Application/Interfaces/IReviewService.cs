using BookReview.Application.DTOs;

namespace BookReview.Application.Interfaces;

public interface IReviewService
{
    Task<ReviewDto> GetByIdAsync(Guid id, string authorId, CancellationToken cancellationToken = default);
    Task<ReviewPublicDto> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<PagedResult<ReviewSummaryDto>> GetPublishedAsync(int page, int pageSize, string? searchTerm = null, CancellationToken cancellationToken = default);
    Task<PagedResult<ReviewSummaryDto>> GetByAuthorAsync(string authorId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<ReviewDto> CreateAsync(CreateReviewRequest request, string authorId, string authorName, CancellationToken cancellationToken = default);
    Task<ReviewDto> UpdateAsync(Guid id, UpdateReviewRequest request, string authorId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, string authorId, CancellationToken cancellationToken = default);
    Task<ReviewDto> UploadCoverImageAsync(Guid id, Stream imageStream, string fileName, string authorId, CancellationToken cancellationToken = default);
    Task<ReviewDto> DiscardDraftAsync(Guid id, string authorId, CancellationToken cancellationToken = default);
    Task<ReviewDto> UnpublishAsync(Guid id, string authorId, CancellationToken cancellationToken = default);
    Task<ReviewDto> PublishAsync(Guid id, string authorId, CancellationToken cancellationToken = default);
}
