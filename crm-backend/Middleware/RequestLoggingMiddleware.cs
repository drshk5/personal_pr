using System.Diagnostics;

namespace crm_backend.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        var method = context.Request.Method;
        var path = context.Request.Path;

        _logger.LogInformation("→ {Method} {Path}", method, path);

        await _next(context);

        sw.Stop();
        var statusCode = context.Response.StatusCode;
        _logger.LogInformation("← {Method} {Path} {StatusCode} ({Elapsed}ms)",
            method, path, statusCode, sw.ElapsedMilliseconds);
    }
}
