using BookReview.Application.Interfaces;
using BookReview.Application.Services;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace BookReview.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IReviewService, ReviewService>();
        services.AddValidatorsFromAssemblyContaining<IReviewService>();

        return services;
    }
}
