using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace AuditSoftware.Middleware
{
    /// <summary>
    /// Middleware for extracting refresh tokens from secure HttpOnly cookies
    /// If a refresh token is stored in a cookie, this middleware adds it to the Authorization header
    /// for easier processing by downstream handlers.
    /// 
    /// Policy:
    /// - Clients MUST use HttpOnly cookie: RefreshToken (set by SetRefreshTokenCookie)
    /// - JSON body may optionally include { "refreshToken": "token-value" }, but headers are ignored
    /// </summary>
    public class RefreshTokenCookieMiddleware
    {
        private readonly RequestDelegate _next;

        public RefreshTokenCookieMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Only process refresh token endpoints
            var path = context.Request.Path.Value?.ToLower() ?? "";
            
            if (path.Contains("/api/auth/refresh") || path.Contains("/api/auth/refreshtoken"))
            {
                // If a refresh token cookie is present, surface it via HttpContext.Items
                if (context.Request.Cookies.TryGetValue("RefreshToken", out var cookieToken))
                {
                    // Store cookie token in HttpContext.Items for controller access
                    context.Items["RefreshTokenFromCookie"] = cookieToken;
                }
            }

            await _next(context);
        }
    }

    /// <summary>
    /// Extension methods for configuring RefreshTokenCookieMiddleware
    /// </summary>
    public static class RefreshTokenCookieMiddlewareExtensions
    {
        public static IApplicationBuilder UseRefreshTokenCookieMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RefreshTokenCookieMiddleware>();
        }
    }
}
