using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using BookReview.Application.Interfaces;
using BookReview.Domain.Exceptions;
using Microsoft.Extensions.Configuration;
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
    private readonly BlobServiceClient _blobServiceClient;
    private readonly ILogger<AzureBlobStorageService> _logger;
    private readonly string? _externalBlobUrl;

    public AzureBlobStorageService(BlobServiceClient blobServiceClient, ILogger<AzureBlobStorageService> logger, IConfiguration configuration)
    {
        _blobServiceClient = blobServiceClient;
        _containerClient = blobServiceClient.GetBlobContainerClient(ContainerName);
        _logger = logger;
        _externalBlobUrl = configuration["AzureStorage:ExternalUrl"];
    }

    public async Task<string> UploadImageAsync(Stream stream, string fileName, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        if (!AllowedExtensions.Contains(extension))
            throw new DomainException($"File type '{extension}' is not allowed. Allowed types: JPEG, PNG, WebP.");

        if (stream.Length > MaxFileSizeBytes)
            throw new DomainException($"File size exceeds the maximum allowed size of 5MB.");

        var response = await _containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);
        if (response is null)
        {
            // Container already existed — ensure public access is set
            await _containerClient.SetAccessPolicyAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);
        }

        var blobName = $"{Guid.NewGuid():N}{extension}";
        if (fileName.Contains('/'))
        {
            var prefix = fileName[..fileName.LastIndexOf('/')];
            // Sanitize: strip path traversal characters
            prefix = prefix.Replace("..", "").Replace("\\", "").Trim('/');
            if (!string.IsNullOrEmpty(prefix))
                blobName = $"{prefix}/{blobName}";
        }

        var blobClient = _containerClient.GetBlobClient(blobName);

        var contentType = extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };

        await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = contentType }, cancellationToken: cancellationToken);

        var url = blobClient.Uri.ToString();
        if (!string.IsNullOrEmpty(_externalBlobUrl))
        {
            var internalBase = _blobServiceClient.Uri.ToString().TrimEnd('/');
            url = url.Replace(internalBase, _externalBlobUrl.TrimEnd('/'));
        }

        return url;
    }

    public async Task DeleteImageAsync(string url, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
            return;

        try
        {
            var uri = new Uri(url);
            var blobName = string.Join("/", uri.Segments.Skip(2)).TrimStart('/');
            var blobClient = _containerClient.GetBlobClient(blobName);
            await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete blob image at {Url}", url);
        }
    }
}
