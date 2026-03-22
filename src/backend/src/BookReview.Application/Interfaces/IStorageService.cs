namespace BookReview.Application.Interfaces;

public interface IStorageService
{
    Task<string> UploadImageAsync(Stream stream, string fileName, CancellationToken cancellationToken = default);
    Task DeleteImageAsync(string url, CancellationToken cancellationToken = default);
}
