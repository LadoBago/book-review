using Azure.Storage.Blobs;
using BookReview.Application.Interfaces;
using BookReview.Domain.Repositories;
using BookReview.Infrastructure.Persistence;
using BookReview.Infrastructure.Persistence.Repositories;
using BookReview.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BookReview.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IReviewRepository, ReviewRepository>();

        var storageConnectionString = configuration["AzureStorage:ConnectionString"];
        if (!string.IsNullOrWhiteSpace(storageConnectionString))
        {
            services.AddSingleton(new BlobServiceClient(storageConnectionString));
            services.AddScoped<IStorageService, AzureBlobStorageService>();
        }
        else
        {
            services.AddScoped<IStorageService, NoOpStorageService>();
        }

        return services;
    }
}
