using BookReview.Application.DTOs;
using FluentValidation;

namespace BookReview.Application.Validators;

public class CreateReviewRequestValidator : AbstractValidator<CreateReviewRequest>
{
    public CreateReviewRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Body is required.");

        RuleFor(x => x.Status)
            .Must(s => s is "Draft" or "Published")
            .WithMessage("Status must be either 'Draft' or 'Published'.");

        RuleFor(x => x.Quotes)
            .Must(q => q.Count <= 50)
            .WithMessage("A review can have at most 50 quotes.");

        RuleForEach(x => x.Quotes)
            .NotEmpty().WithMessage("Quote text cannot be empty.")
            .MaximumLength(500).WithMessage("Each quote must not exceed 500 characters.");
    }
}
