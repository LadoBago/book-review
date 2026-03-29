using BookReview.Application.DTOs;
using BookReview.Application.Interfaces;
using BookReview.Presentation.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BookReview.Presentation.Controllers;

[ApiController]
[Route("api/moderation")]
[Authorize(Policy = "Admin")]
[EnableRateLimiting("fixed")]
public class ModerationController : ControllerBase
{
    private readonly IModerationService _moderationService;
    private readonly IValidator<RejectReviewRequest> _rejectValidator;

    public ModerationController(
        IModerationService moderationService,
        IValidator<RejectReviewRequest> rejectValidator)
    {
        _moderationService = moderationService;
        _rejectValidator = rejectValidator;
    }

    [HttpGet("pending")]
    public async Task<ActionResult<PagedResult<ReviewSummaryDto>>> GetPending(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var adminId = User.GetUserId();
        var result = await _moderationService.GetPendingAsync(page, pageSize, adminId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("reviews/{id:guid}")]
    public async Task<ActionResult<ReviewDto>> GetReviewById(Guid id, CancellationToken cancellationToken = default)
    {
        var review = await _moderationService.GetReviewByIdAsync(id, cancellationToken);
        return Ok(review);
    }

    [HttpPost("reviews/{id:guid}/approve")]
    public async Task<ActionResult<ReviewDto>> Approve(Guid id, CancellationToken cancellationToken = default)
    {
        var review = await _moderationService.ApproveAsync(id, cancellationToken);
        return Ok(review);
    }

    [HttpPost("reviews/{id:guid}/reject")]
    public async Task<ActionResult<ReviewDto>> Reject(
        Guid id,
        [FromBody] RejectReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        await _rejectValidator.ValidateAndThrowAsync(request, cancellationToken);
        var review = await _moderationService.RejectAsync(id, request.Reason, cancellationToken);
        return Ok(review);
    }
}
