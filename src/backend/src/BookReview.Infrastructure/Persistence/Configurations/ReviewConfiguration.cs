using BookReview.Domain.Entities;
using BookReview.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BookReview.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(r => r.Body)
            .IsRequired();

        builder.Property(r => r.CoverImageUrl)
            .HasMaxLength(500);

        builder.Property(r => r.Slug)
            .HasConversion(
                slug => slug.Value,
                value => Slug.FromValue(value))
            .IsRequired()
            .HasMaxLength(250);

        builder.HasIndex(r => r.Slug).IsUnique();

        builder.Property(r => r.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(r => r.Status);

        builder.Property(r => r.AuthorId)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(r => r.AuthorId);

        builder.Property(r => r.AuthorName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(r => r.DraftTitle)
            .HasMaxLength(200);

        builder.Property(r => r.DraftBody);

        builder.Property(r => r.DraftQuotes)
            .HasColumnType("jsonb");

        builder.Property(r => r.RejectionReason)
            .HasMaxLength(500);

        builder.Ignore(r => r.HasDraft);

        builder.HasMany(r => r.Quotes)
            .WithOne()
            .HasForeignKey(q => q.ReviewId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
