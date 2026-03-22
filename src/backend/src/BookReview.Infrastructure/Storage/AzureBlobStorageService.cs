using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using BookReview.Application.Interfaces;
using BookReview.Domain.Exceptions;

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

    public AzureBlobStorageService(BlobServiceClient blobServiceClient)
    {
        _containerClient = blobServiceClient.GetBlobContainerClient(ContainerName);
    }

    public async Task<string> UploadImageAsync(Stream stream, string fileName, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        if (!AllowedExtensions.Contains(extension))
            throw new DomainException($"File type '{extension}' is not allowed. Allowed types: JPEG, PNG, WebP.");

        if (stream.Length > MaxFileSizeBytes)
            throw new DomainException($"File size exceeds the maximum allowed size of 5MB.");

        await _containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);

        var blobName = $"{Guid.NewGuid():N}{extension}";
        if (fileName.Contains('/'))
        {
            var prefix = fileName[..fileName.LastIndexOf('/')];
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

        return blobClient.Uri.ToString();
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
        catch (Exception)
        {
            // Log but don't fail if deletion fails
        }
    }
}
