using System.Security.Claims;

namespace BookReview.Presentation.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string GetUserId(this ClaimsPrincipal principal)
    {
        return principal.FindFirst("sub")?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User ID not found in token.");
    }

    public static string GetUserName(this ClaimsPrincipal principal)
    {
        return principal.FindFirst("preferred_username")?.Value
            ?? principal.FindFirst("name")?.Value
            ?? principal.FindFirst(ClaimTypes.Name)?.Value
            ?? "Unknown";
    }
}
