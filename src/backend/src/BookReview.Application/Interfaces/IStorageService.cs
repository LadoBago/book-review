namespace BookReview.Application.Interfaces;

public interface IStorageService
{
    Task<string> UploadImageAsync(Stream stream, string fileName, CancellationToken cancellationToken = default);
    Task DeleteImageAsync(string imageUrl, CancellationToken cancellationToken = default);
    Task<(Stream Content, string ContentType)?> DownloadImageAsync(string blobName, CancellationToken cancellationToken = default);
}
