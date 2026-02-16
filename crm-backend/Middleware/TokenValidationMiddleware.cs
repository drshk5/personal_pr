using System.IdentityModel.Tokens.Jwt;

namespace crm_backend.Middleware;

public class TokenValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TokenValidationMiddleware> _logger;

    public TokenValidationMiddleware(RequestDelegate next, ILogger<TokenValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip for health check and swagger
        var path = context.Request.Path.Value?.ToLower() ?? "";
        if (path.Contains("/status") || path.Contains("/swagger") || path.Contains("/hubs/"))
        {
            await _next(context);
            return;
        }

        if (context.Request.Headers.TryGetValue("Authorization", out var authHeader))
        {
            var token = authHeader.ToString().Replace("Bearer ", string.Empty);
            var handler = new JwtSecurityTokenHandler();

            if (handler.CanReadToken(token))
            {
                context.Items["RawToken"] = token;
            }
        }

        await _next(context);
    }
}
