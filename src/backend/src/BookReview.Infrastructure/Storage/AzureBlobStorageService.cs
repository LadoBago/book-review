using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using BookReview.Application.Interfaces;
using BookReview.Domain.Exceptions;
using Microsoft.Extensions.Logging;

namespace BookReview.Infrastructure.Storage;

public class AzureBlobStorageService : IStorageService
{
    private const string ContainerName = "cover-images";
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5MB

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private readonly BlobContainerClient _containerClient;
    private readonly ILogger<AzureBlobStorageService> _logger;

    public AzureBlobStorageService(BlobServiceClient blobServiceClient, ILogger<AzureBlobStorageService> logger)
    {
        _containerClient = blobServiceClient.GetBlobContainerClient(ContainerName);
        _logger = logger;
    }

    public async Task<string> UploadImageAsync(Stream stream, string fileName, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        if (!AllowedExtensions.Contains(extension))
            throw new DomainException($"File type '{extension}' is not allowed. Allowed types: JPEG, PNG, WebP.");

        if (stream.Length > MaxFileSizeBytes)
            throw new DomainException($"File size exceeds the maximum allowed size of 5MB.");

        await _containerClient.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken);

        // Use only a random GUID as blob name — never trust user-supplied file paths
        var blobName = $"{Guid.NewGuid():N}{extension}";

        var blobClient = _containerClient.GetBlobClient(blobName);

        var contentType = extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };

        await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = contentType }, cancellationToken: cancellationToken);

        return $"/api/images/{blobName}";
    }

    public async Task DeleteImageAsync(string imageUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            return;

        try
        {
            var blobName = ExtractBlobName(imageUrl);
            var blobClient = _containerClient.GetBlobClient(blobName);
            await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete blob image at {Url}", imageUrl);
        }
    }

    public async Task<(Stream Content, string ContentType)?> DownloadImageAsync(string blobName, CancellationToken cancellationToken = default)
    {
        var blobClient = _containerClient.GetBlobClient(blobName);

        if (!await blobClient.ExistsAsync(cancellationToken))
            return null;

        var response = await blobClient.DownloadStreamingAsync(cancellationToken: cancellationToken);
        var contentType = response.Value.Details.ContentType ?? "application/octet-stream";
        return (response.Value.Content, contentType);
    }

    private static string ExtractBlobName(string imageUrl)
    {
        // Handle new format: /api/images/{blobName}
        const string apiPrefix = "/api/images/";
        if (imageUrl.StartsWith(apiPrefix, StringComparison.OrdinalIgnoreCase))
            return imageUrl[apiPrefix.Length..];

        // Handle legacy format: http://host:port/account/cover-images/{blobName}
        var uri = new Uri(imageUrl);
        return string.Join("/", uri.Segments.Skip(2)).TrimStart('/');
    }
}
