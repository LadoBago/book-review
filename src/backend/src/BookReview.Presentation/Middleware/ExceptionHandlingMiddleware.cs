using BookReview.Domain.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace BookReview.Presentation.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access: {Message}", ex.Message);
            await WriteProblemDetails(context, StatusCodes.Status401Unauthorized, "Unauthorized",
                SafeDetail("Authentication required.", ex));
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Not found: {Message}", ex.Message);
            await WriteProblemDetails(context, StatusCodes.Status404NotFound, "Not Found",
                SafeDetail("The requested resource was not found.", ex));
        }
        catch (ForbiddenException ex)
        {
            _logger.LogWarning(ex, "Forbidden: {Message}", ex.Message);
            await WriteProblemDetails(context, StatusCodes.Status403Forbidden, "Forbidden",
                SafeDetail("You do not have permission to perform this action.", ex));
        }
        catch (DomainException ex)
        {
            _logger.LogWarning(ex, "Domain exception: {Message}", ex.Message);
            // Domain exceptions contain user-facing validation messages (e.g. "Review must be unpublished before deleting")
            await WriteProblemDetails(context, StatusCodes.Status400BadRequest, "Bad Request", ex.Message);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation exception");
            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(new ValidationProblemDetails(errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await WriteProblemDetails(context, StatusCodes.Status500InternalServerError, "Internal Server Error",
                "An unexpected error occurred.");
        }
    }

    private string SafeDetail(string genericMessage, Exception ex)
    {
        // In development, include the real message for easier debugging.
        // In production, return a generic message to avoid information leakage.
        return _environment.IsDevelopment() ? ex.Message : genericMessage;
    }

    private static async Task WriteProblemDetails(HttpContext context, int statusCode, string title, string detail)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail
        });
    }
}
