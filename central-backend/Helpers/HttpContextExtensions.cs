using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace AuditSoftware.Helpers
{
    /// <summary>
    /// Extension methods for HttpContext to retrieve timezone information
    /// </summary>
    public static class HttpContextExtensions
    {
        /// <summary>
        /// Gets the user's timezone from the claims
        /// </summary>
        /// <param name="context">The HttpContext</param>
        /// <returns>The timezone ID or the default timezone</returns>
        public static string GetUserTimeZone(this HttpContext context)
        {
            if (context?.User?.Identity?.IsAuthenticated == true)
            {
                var timeZone = context.User.FindFirst("strTimeZone")?.Value;
                if (!string.IsNullOrEmpty(timeZone))
                {
                    return timeZone;
                }
            }

            return DateTimeProvider.DefaultTimeZone;
        }
    }
}
