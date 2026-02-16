using System.Diagnostics;

namespace crm_backend.Middleware;

public class PerformanceMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PerformanceMiddleware> _logger;
    private const int SlowRequestThresholdMs = 500;

    public PerformanceMiddleware(RequestDelegate next, ILogger<PerformanceMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();

        await _next(context);

        sw.Stop();
        if (sw.ElapsedMilliseconds > SlowRequestThresholdMs)
        {
            _logger.LogWarning("SLOW REQUEST: {Method} {Path} took {Elapsed}ms",
                context.Request.Method, context.Request.Path, sw.ElapsedMilliseconds);
        }
    }
}
