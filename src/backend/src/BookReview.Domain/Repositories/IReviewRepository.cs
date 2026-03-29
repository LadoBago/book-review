using BookReview.Domain.Entities;

namespace BookReview.Domain.Repositories;

public interface IReviewRepository
{
    Task<Review?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Review?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Review> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        ReviewStatus? status = null,
        string? authorId = null,
        CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Review> Items, int TotalCount)> GetPendingModerationAsync(
        int page,
        int pageSize,
        string? excludeAuthorId = null,
        CancellationToken cancellationToken = default);
    Task AddAsync(Review review, CancellationToken cancellationToken = default);
    Task UpdateAsync(Review review, CancellationToken cancellationToken = default);
    Task DeleteAsync(Review review, CancellationToken cancellationToken = default);
    Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default);
}
