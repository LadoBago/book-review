using BookReview.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BookReview.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Quote> Quotes => Set<Quote>();

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
