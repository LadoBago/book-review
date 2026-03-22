using BookReview.Domain.Entities;
using BookReview.Domain.Repositories;
using BookReview.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace BookReview.Infrastructure.Persistence.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly AppDbContext _context;

    public ReviewRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Review?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Reviews
            .Include(r => r.Quotes.OrderBy(q => q.SortOrder))
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<Review?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var slugValue = Slug.FromValue(slug);
        return await _context.Reviews
            .Include(r => r.Quotes.OrderBy(q => q.SortOrder))
            .FirstOrDefaultAsync(r => r.Slug == slugValue, cancellationToken);
    }

    public async Task<(IReadOnlyList<Review> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        string? searchTerm = null,
        ReviewStatus? status = null,
        string? authorId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Reviews
            .Include(r => r.Quotes.OrderBy(q => q.SortOrder))
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(r => r.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(authorId))
            query = query.Where(r => r.AuthorId == authorId);

        if (!string.IsNullOrWhiteSpace(searchTerm))
            query = query.Where(r => EF.Functions.ILike(r.Title, $"%{searchTerm}%"));

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task AddAsync(Review review, CancellationToken cancellationToken = default)
    {
        await _context.Reviews.AddAsync(review, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Review review, CancellationToken cancellationToken = default)
    {
        // Delete all existing quotes for this review directly in DB
        await _context.Quotes
            .Where(q => q.ReviewId == review.Id)
            .ExecuteDeleteAsync(cancellationToken);

        // Detach all tracked quote entities to avoid change tracker conflicts
        foreach (var entry in _context.ChangeTracker.Entries<Quote>()
            .Where(e => e.Entity.ReviewId == review.Id).ToList())
        {
            entry.State = EntityState.Detached;
        }

        // Add all current quotes as new entities
        foreach (var quote in review.Quotes)
        {
            _context.Entry(quote).State = EntityState.Added;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Review review, CancellationToken cancellationToken = default)
    {
        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default)
    {
        var slugValue = Slug.FromValue(slug);
        return await _context.Reviews
            .AnyAsync(r => r.Slug == slugValue, cancellationToken);
    }
}
