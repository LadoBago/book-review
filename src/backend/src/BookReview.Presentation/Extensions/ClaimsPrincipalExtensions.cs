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

    public static bool IsAdmin(this ClaimsPrincipal principal)
    {
        // Keycloak realm roles are in realm_access.roles claim (JSON)
        // With MapInboundClaims=false, check the "realm_access" claim
        var realmAccess = principal.FindFirst("realm_access")?.Value;
        if (realmAccess != null)
        {
            try
            {
                var doc = System.Text.Json.JsonDocument.Parse(realmAccess);
                if (doc.RootElement.TryGetProperty("roles", out var roles))
                {
                    foreach (var role in roles.EnumerateArray())
                    {
                        if (role.GetString() == "admin")
                            return true;
                    }
                }
            }
            catch
            {
                // Ignore parse errors
            }
        }

        // Fallback: check standard role claims
        return principal.IsInRole("admin");
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
