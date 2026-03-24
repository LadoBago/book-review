using BookReview.Application.DTOs;
using FluentValidation;

namespace BookReview.Application.Validators;

public class RejectReviewRequestValidator : AbstractValidator<RejectReviewRequest>
{
    public RejectReviewRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Rejection reason is required.")
            .MaximumLength(500).WithMessage("Rejection reason must not exceed 500 characters.");
    }
}
