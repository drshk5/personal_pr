using Microsoft.AspNetCore.Builder;

namespace AuditSoftware.Middleware
{
    /// <summary>
    /// Extension method to add the TimeZone middleware to the application pipeline
    /// </summary>
    public static class TimeZoneMiddlewareExtensions
    {
        public static IApplicationBuilder UseTimeZoneMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<TimeZoneMiddleware>();
        }
    }
}
