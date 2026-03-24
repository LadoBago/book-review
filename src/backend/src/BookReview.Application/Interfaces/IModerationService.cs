using BookReview.Application.DTOs;

namespace BookReview.Application.Interfaces;

public interface IModerationService
{
    Task<ReviewDto> GetReviewByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<ReviewSummaryDto>> GetPendingAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<ReviewDto> ApproveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ReviewDto> RejectAsync(Guid id, string reason, CancellationToken cancellationToken = default);
    Task<ReviewDto> PublishDirectAsync(Guid id, string authorId, CancellationToken cancellationToken = default);
}
