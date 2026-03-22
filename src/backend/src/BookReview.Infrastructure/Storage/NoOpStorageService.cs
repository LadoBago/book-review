using BookReview.Application.Interfaces;

namespace BookReview.Infrastructure.Storage;

public class NoOpStorageService : IStorageService
{
    public Task<string> UploadImageAsync(Stream stream, string fileName, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"/images/{fileName}");
    }

    public Task DeleteImageAsync(string url, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
