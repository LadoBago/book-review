using BookReview.Application.Interfaces;

namespace BookReview.Infrastructure.Storage;

public class NoOpStorageService : IStorageService
{
    public Task<string> UploadImageAsync(Stream stream, string fileName, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"/api/images/{fileName}");
    }

    public Task DeleteImageAsync(string imageUrl, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task<(Stream Content, string ContentType)?> DownloadImageAsync(string blobName, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<(Stream Content, string ContentType)?>(null);
    }
}
