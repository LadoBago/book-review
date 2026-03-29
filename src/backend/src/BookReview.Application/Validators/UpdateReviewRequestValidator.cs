using BookReview.Application.DTOs;
using BookReview.Domain.Entities;
using FluentValidation;

namespace BookReview.Application.Validators;

public class UpdateReviewRequestValidator : AbstractValidator<UpdateReviewRequest>
{
    public UpdateReviewRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title cannot be empty.")
            .MinimumLength(3).WithMessage("Title must be at least 3 characters.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.")
            .When(x => x.Title != null);

        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Body cannot be empty.")
            .MinimumLength(10).WithMessage("Body must be at least 10 characters.")
            .MaximumLength(100_000).WithMessage("Body must not exceed 100,000 characters.")
            .When(x => x.Body != null);

        RuleFor(x => x.Status)
            .Must(s => s is nameof(ReviewStatus.Draft) or nameof(ReviewStatus.Published))
            .WithMessage("Status must be either 'Draft' or 'Published'.")
            .When(x => x.Status != null);

        RuleFor(x => x.Quotes)
            .Must(q => q!.Count <= 50)
            .WithMessage("A review can have at most 50 quotes.")
            .When(x => x.Quotes != null);

        RuleForEach(x => x.Quotes)
            .NotEmpty().WithMessage("Quote text cannot be empty.")
            .MaximumLength(500).WithMessage("Each quote must not exceed 500 characters.")
            .When(x => x.Quotes != null);
    }
}
