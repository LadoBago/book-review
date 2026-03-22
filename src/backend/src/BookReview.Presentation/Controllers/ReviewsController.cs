using BookReview.Application.DTOs;
using BookReview.Application.Interfaces;
using BookReview.Presentation.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookReview.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;
    private readonly IValidator<CreateReviewRequest> _createValidator;
    private readonly IValidator<UpdateReviewRequest> _updateValidator;

    public ReviewsController(
        IReviewService reviewService,
        IValidator<CreateReviewRequest> createValidator,
        IValidator<UpdateReviewRequest> updateValidator)
    {
        _reviewService = reviewService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ReviewSummaryDto>>> GetPublished(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _reviewService.GetPublishedAsync(page, pageSize, search, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<ReviewDto>> GetBySlug(string slug, CancellationToken cancellationToken = default)
    {
        var review = await _reviewService.GetBySlugAsync(slug, cancellationToken);
        return Ok(review);
    }

    [Authorize]
    [HttpGet("by-id/{id:guid}")]
    public async Task<ActionResult<ReviewDto>> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var review = await _reviewService.GetByIdAsync(id, cancellationToken);
        return Ok(review);
    }

    [Authorize]
    [HttpGet("my")]
    public async Task<ActionResult<PagedResult<ReviewSummaryDto>>> GetMyReviews(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var authorId = User.GetUserId();
        var result = await _reviewService.GetByAuthorAsync(authorId, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ReviewDto>> Create(
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        var authorId = User.GetUserId();
        var authorName = User.GetUserName();
        var review = await _reviewService.CreateAsync(request, authorId, authorName, cancellationToken);
        return CreatedAtAction(nameof(GetBySlug), new { slug = review.Slug }, review);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ReviewDto>> Update(
        Guid id,
        [FromBody] UpdateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);

        var authorId = User.GetUserId();
        var review = await _reviewService.UpdateAsync(id, request, authorId, cancellationToken);
        return Ok(review);
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var authorId = User.GetUserId();
        await _reviewService.DeleteAsync(id, authorId, cancellationToken);
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:guid}/cover")]
    public async Task<ActionResult<ReviewDto>> UploadCover(
        Guid id,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        var authorId = User.GetUserId();
        using var stream = file.OpenReadStream();
        var review = await _reviewService.UploadCoverImageAsync(id, stream, file.FileName, authorId, cancellationToken);
        return Ok(review);
    }
}
