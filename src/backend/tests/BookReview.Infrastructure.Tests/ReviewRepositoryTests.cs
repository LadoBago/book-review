using BookReview.Domain.Entities;
using BookReview.Infrastructure.Persistence;
using BookReview.Infrastructure.Persistence.Repositories;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace BookReview.Infrastructure.Tests;

public class ReviewRepositoryTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly SqliteConnection _connection;
    private readonly ReviewRepository _repository;

    public ReviewRepositoryTests()
    {
        (_context, _connection) = TestDbContextFactory.Create();
        _repository = new ReviewRepository(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task AddAsync_ValidReview_PersistsToDatabase()
    {
        var review = new Review("Test Title", "Test Body", "user-1", "John", ["Quote 1"]);

        await _repository.AddAsync(review);

        var saved = await _context.Reviews.Include(r => r.Quotes).FirstAsync();
        Assert.Equal("Test Title", saved.Title);
        Assert.Equal("Test Body", saved.Body);
        Assert.Equal("user-1", saved.AuthorId);
        Assert.Single(saved.Quotes);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingReview_IncludesOrderedQuotes()
    {
        var review = new Review("Title", "Body", "user-1", "John", ["Second", "First", "Third"]);
        await _repository.AddAsync(review);
        _context.ChangeTracker.Clear();

        var result = await _repository.GetByIdAsync(review.Id);

        Assert.NotNull(result);
        Assert.Equal(3, result!.Quotes.Count);
        Assert.Equal("Second", result.Quotes[0].Text);
        Assert.Equal("First", result.Quotes[1].Text);
        Assert.Equal("Third", result.Quotes[2].Text);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistent_ReturnsNull()
    {
        var result = await _repository.GetByIdAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetBySlugAsync_ExistingReview_ReturnsReview()
    {
        var review = new Review("My Book", "Body", "user-1", "John");
        await _repository.AddAsync(review);
        _context.ChangeTracker.Clear();

        var result = await _repository.GetBySlugAsync(review.Slug.Value);

        Assert.NotNull(result);
        Assert.Equal(review.Id, result!.Id);
    }

    [Fact]
    public async Task UpdateAsync_ChangesQuotes_PersistsNewQuotes()
    {
        var review = new Review("Title", "Body", "user-1", "John", ["Old Quote 1", "Old Quote 2"]);
        await _repository.AddAsync(review);

        review.UpdateContent("Title", "Body", ["New Quote A", "New Quote B", "New Quote C"]);
        await _repository.UpdateAsync(review);
        _context.ChangeTracker.Clear();

        var saved = await _repository.GetByIdAsync(review.Id);
        Assert.Equal(3, saved!.Quotes.Count);
        Assert.Equal("New Quote A", saved.Quotes[0].Text);
        Assert.Equal("New Quote B", saved.Quotes[1].Text);
        Assert.Equal("New Quote C", saved.Quotes[2].Text);
    }

    [Fact]
    public async Task UpdateAsync_PreservesReviewFieldChanges()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        await _repository.AddAsync(review);

        review.UpdateContent("Updated Title", "Updated Body");
        await _repository.UpdateAsync(review);
        _context.ChangeTracker.Clear();

        var saved = await _repository.GetByIdAsync(review.Id);
        Assert.Equal("Updated Title", saved!.Title);
        Assert.Equal("Updated Body", saved.Body);
    }

    [Fact]
    public async Task UpdateAsync_WithDraftRevision_PersistsDraftFields()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        review.Publish();
        await _repository.AddAsync(review);

        review.SaveDraftRevision("Draft Title", "Draft Body", ["Draft Quote"]);
        await _repository.UpdateAsync(review);
        _context.ChangeTracker.Clear();

        var saved = await _repository.GetByIdAsync(review.Id);
        Assert.Equal("Draft Title", saved!.DraftTitle);
        Assert.Equal("Draft Body", saved.DraftBody);
        Assert.NotNull(saved.DraftQuotes);
        Assert.Single(saved.DraftQuotes!);
        Assert.Equal("Draft Quote", saved.DraftQuotes![0]);
    }

    [Fact]
    public async Task DeleteAsync_RemovesReviewAndQuotes()
    {
        var review = new Review("Title", "Body", "user-1", "John", ["Quote 1"]);
        await _repository.AddAsync(review);

        await _repository.DeleteAsync(review);

        Assert.Equal(0, await _context.Reviews.CountAsync());
        Assert.Equal(0, await _context.Quotes.CountAsync());
    }

    [Fact]
    public async Task GetPagedAsync_FiltersByStatus_ReturnsPaginated()
    {
        var draft = new Review("Draft Review", "Body", "user-1", "John");
        var published1 = new Review("Published One", "Body", "user-1", "John");
        published1.Publish();
        var published2 = new Review("Published Two", "Body", "user-1", "John");
        published2.Publish();

        await _repository.AddAsync(draft);
        await _repository.AddAsync(published1);
        await _repository.AddAsync(published2);

        var (items, totalCount) = await _repository.GetPagedAsync(
            page: 1, pageSize: 10, status: ReviewStatus.Published);

        Assert.Equal(2, totalCount);
        Assert.Equal(2, items.Count);
        Assert.All(items, r => Assert.Equal(ReviewStatus.Published, r.Status));
    }

    [Fact]
    public async Task GetPagedAsync_FiltersByAuthor()
    {
        var review1 = new Review("Review 1", "Body", "user-1", "John");
        var review2 = new Review("Review 2", "Body", "user-2", "Jane");
        await _repository.AddAsync(review1);
        await _repository.AddAsync(review2);

        var (items, totalCount) = await _repository.GetPagedAsync(
            page: 1, pageSize: 10, authorId: "user-1");

        Assert.Equal(1, totalCount);
        Assert.Single(items);
        Assert.Equal("user-1", items[0].AuthorId);
    }

    [Fact]
    public async Task GetPagedAsync_PaginatesCorrectly()
    {
        for (var i = 0; i < 5; i++)
        {
            var review = new Review($"Review {i}", "Body", "user-1", "John");
            await _repository.AddAsync(review);
        }

        var (page1Items, totalCount) = await _repository.GetPagedAsync(page: 1, pageSize: 2);
        var (page2Items, _) = await _repository.GetPagedAsync(page: 2, pageSize: 2);

        Assert.Equal(5, totalCount);
        Assert.Equal(2, page1Items.Count);
        Assert.Equal(2, page2Items.Count);
    }

    [Fact]
    public async Task SlugExistsAsync_ExistingSlug_ReturnsTrue()
    {
        var review = new Review("Title", "Body", "user-1", "John");
        await _repository.AddAsync(review);

        var exists = await _repository.SlugExistsAsync(review.Slug.Value);

        Assert.True(exists);
    }

    [Fact]
    public async Task SlugExistsAsync_NonExistentSlug_ReturnsFalse()
    {
        var exists = await _repository.SlugExistsAsync("nonexistent-slug");

        Assert.False(exists);
    }
}
