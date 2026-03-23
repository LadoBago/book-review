using BookReview.Application.DTOs;
using BookReview.Domain.Entities;

namespace BookReview.Application.Mapping;

public static class ReviewMappingExtensions
{
    public static ReviewDto ToDto(this Review review)
    {
        return new ReviewDto
        {
            Id = review.Id,
            Title = review.Title,
            Body = review.Body,
            CoverImageUrl = review.CoverImageUrl,
            Slug = review.Slug.Value,
            Status = review.Status.ToString(),
            AuthorId = review.AuthorId,
            AuthorName = review.AuthorName,
            CreatedAt = review.CreatedAt,
            UpdatedAt = review.UpdatedAt,
            Quotes = review.Quotes.Select(q => new QuoteDto
            {
                Id = q.Id,
                Text = q.Text
            }).ToList(),
            HasDraft = review.HasDraft,
            DraftTitle = review.DraftTitle,
            DraftBody = review.DraftBody,
            DraftQuotes = review.DraftQuotes?.ToList()
        };
    }

    public static ReviewPublicDto ToPublicDto(this Review review)
    {
        return new ReviewPublicDto
        {
            Id = review.Id,
            Title = review.Title,
            Body = review.Body,
            CoverImageUrl = review.CoverImageUrl,
            Slug = review.Slug.Value,
            Status = review.Status.ToString(),
            AuthorId = review.AuthorId,
            AuthorName = review.AuthorName,
            CreatedAt = review.CreatedAt,
            UpdatedAt = review.UpdatedAt,
            Quotes = review.Quotes.Select(q => new QuoteDto
            {
                Id = q.Id,
                Text = q.Text
            }).ToList()
        };
    }

    public static ReviewSummaryDto ToSummaryDto(this Review review)
    {
        return new ReviewSummaryDto
        {
            Id = review.Id,
            Title = review.Title,
            Slug = review.Slug.Value,
            CoverImageUrl = review.CoverImageUrl,
            Status = review.Status.ToString(),
            AuthorName = review.AuthorName,
            CreatedAt = review.CreatedAt,
            HasDraft = review.HasDraft
        };
    }
}
