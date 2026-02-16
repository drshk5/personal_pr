using System.Security.Claims;

namespace crm_backend.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserGuid(this ClaimsPrincipal user)
    {
        var claim = user.FindFirst("strUserGUID")?.Value;
        return claim != null ? Guid.Parse(claim) : Guid.Empty;
    }

    public static Guid GetGroupGuid(this ClaimsPrincipal user)
    {
        var claim = user.FindFirst("strGroupGUID")?.Value;
        return claim != null ? Guid.Parse(claim) : Guid.Empty;
    }

    public static string GetUserName(this ClaimsPrincipal user)
    {
        return user.FindFirst("strName")?.Value ?? "Unknown";
    }

    public static string GetEmail(this ClaimsPrincipal user)
    {
        return user.FindFirst("strEmailId")?.Value ?? string.Empty;
    }
}
