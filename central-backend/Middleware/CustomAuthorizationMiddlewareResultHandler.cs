using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AuditSoftware.DTOs.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace AuditSoftware.Middleware;

public class CustomAuthorizationMiddlewareResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();
    private readonly ILogger<CustomAuthorizationMiddlewareResultHandler> _logger;

    public CustomAuthorizationMiddlewareResultHandler(ILogger<CustomAuthorizationMiddlewareResultHandler> logger)
    {
        _logger = logger;
    }

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        // If authorization failed, return a proper error response
        if (!authorizeResult.Succeeded && authorizeResult.Challenged)
        {
            var path = context.Request.Path.Value ?? string.Empty;
            var hasAuthHeader = !string.IsNullOrEmpty(context.Request.Headers["Authorization"].ToString());
            Console.WriteLine($"[AUTH] Challenge at {path}. Has Authorization header: {hasAuthHeader}");
            _logger.LogWarning("[AUTH] Challenge at {Path}. Has Authorization header: {HasAuth}", path, hasAuthHeader);

            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            
            var errorResponse = new ApiResponse<object>
            {
                statusCode = 401,
                Message = "Authentication required. Please provide a valid token."
            };

            var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = null,
                WriteIndented = true
            });

            await context.Response.WriteAsync(jsonResponse);
            return;
        }

        if (!authorizeResult.Succeeded && authorizeResult.Forbidden)
        {
            var path = context.Request.Path.Value ?? string.Empty;
            var isAuth = context.User?.Identity?.IsAuthenticated == true;
            Console.WriteLine($"[AUTH] Forbidden at {path}. User authenticated: {isAuth}");
            _logger.LogWarning("[AUTH] Forbidden at {Path}. User authenticated: {Auth}", path, isAuth);

            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            
            // Determine the specific error message based on the policy
            string errorMessage = "Access denied. Insufficient privileges to perform this operation.";
            
            if (policy != null && policy.Requirements.Any(r => r is SuperAdminRequirement))
            {
                errorMessage = "Access denied. This operation requires SuperAdmin privileges.";
            }
            
            var errorResponse = new ApiResponse<object>
            {
                statusCode = 403,
                Message = errorMessage
            };

            var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = null,
                WriteIndented = true
            });

            await context.Response.WriteAsync(jsonResponse);
            return;
        }

        // If authorization succeeded, continue with the default handler
        await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
    }
}

