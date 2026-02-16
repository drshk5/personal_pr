using System;
using System.IdentityModel.Tokens.Jwt;
using System.Threading.Tasks;
using AuditSoftware.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace AuditSoftware.Middleware
{
    public class SessionValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SessionValidationMiddleware> _logger;

        public SessionValidationMiddleware(RequestDelegate next, ILogger<SessionValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IUserSessionService userSessionService)
        {
            // Skip validation for authentication endpoints
            if (IsAuthEndpoint(context.Request.Path))
            {
                await _next(context);
                return;
            }

            // Check for auth header
            if (!context.Request.Headers.TryGetValue("Authorization", out var authHeader))
            {
                await _next(context);
                return;
            }

            var token = authHeader.ToString().Replace("Bearer ", string.Empty);
            if (string.IsNullOrEmpty(token))
            {
                await _next(context);
                return;
            }

            try
            {
                // Extract claims from token
                var handler = new JwtSecurityTokenHandler();
                if (handler.CanReadToken(token))
                {
                    var jwtToken = handler.ReadJwtToken(token);
                    
                    // In your case, you're using strUserGUID
                    var userGuidClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "strUserGUID");
                    var jwtId = jwtToken.Id; // Use the token's jti claim as session ID
                    
                    if (userGuidClaim != null && !string.IsNullOrEmpty(jwtId))
                    {
                        // Check if this is still the valid session for this user
                        var isValid = await userSessionService.IsValidSessionAsync(userGuidClaim.Value, jwtId);
                        
                        if (!isValid)
                        {
                            _logger.LogWarning($"Invalid session detected for user {userGuidClaim.Value}");
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            context.Response.ContentType = "application/json";
                            await context.Response.WriteAsync("{\"statusCode\":401,\"message\":\"Your session has been invalidated. Please login again.\",\"error\":\"session_expired\"}");
                            return;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating session token");
            }

            await _next(context);
        }

        private bool IsAuthEndpoint(string path)
        {
            // Skip session validation for login, refresh token, etc.
            return path.StartsWith("/api/auth/login", StringComparison.OrdinalIgnoreCase) ||
                   path.StartsWith("/api/auth/refresh-token", StringComparison.OrdinalIgnoreCase) ||
                   path.StartsWith("/api/auth/forgot-password", StringComparison.OrdinalIgnoreCase) ||
                   path.StartsWith("/api/auth/reset-password", StringComparison.OrdinalIgnoreCase);
        }
    }
}
