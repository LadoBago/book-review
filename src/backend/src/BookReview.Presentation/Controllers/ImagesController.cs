using BookReview.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BookReview.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("fixed")]
public class ImagesController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private readonly IStorageService _storageService;

    public ImagesController(IStorageService storageService)
    {
        _storageService = storageService;
    }

    [HttpGet("{blobName}")]
    [ResponseCache(Duration = 86400)]
    public async Task<IActionResult> GetImage(string blobName, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(blobName);
        if (!AllowedExtensions.Contains(extension))
            return BadRequest();

        if (blobName.Contains("..") || blobName.Contains('/') || blobName.Contains('\\'))
            return BadRequest();

        var result = await _storageService.DownloadImageAsync(blobName, cancellationToken);
        if (result is null)
            return NotFound();

        var (content, contentType) = result.Value;
        return File(content, contentType);
    }
}
