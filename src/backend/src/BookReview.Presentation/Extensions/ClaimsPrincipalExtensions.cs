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
        return GetFirstNonEmptyClaim(principal, "preferred_username", "name", ClaimTypes.Name)
            ?? "Unknown";
    }

    public static string GetFullName(this ClaimsPrincipal principal)
    {
        return GetFirstNonEmptyClaim(principal, "name", ClaimTypes.Name, "given_name", "preferred_username")
            ?? "Unknown";
    }

    private static string? GetFirstNonEmptyClaim(ClaimsPrincipal principal, params string[] claimTypes)
    {
        foreach (var type in claimTypes)
        {
            var value = principal.FindFirst(type)?.Value;
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }
        return null;
    }
}
