using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Security.Claims;
using System;
using AuditSoftware.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using AuditSoftware.Helpers;

namespace AuditSoftware.Middleware
{
    /// <summary>
    /// Middleware to enrich the user's claims with timezone information
    /// </summary>
    public class TimeZoneMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<TimeZoneMiddleware> _logger;

        public TimeZoneMiddleware(RequestDelegate next, ILogger<TimeZoneMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
        {
            // Only process authenticated requests with valid identity
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                try
                {
                    // Check if timezone claim is already present
                    if (context.User.FindFirst("strTimeZone") == null)
                    {
                        var userGuid = context.User.FindFirst("strUserGUID")?.Value;
                        var groupGuid = context.User.FindFirst("strGroupGUID")?.Value;

                        if (!string.IsNullOrEmpty(userGuid))
                        {
                            // Get the user's timezone from database
                            var userTimeZone = await GetUserTimeZoneAsync(dbContext, userGuid);
                            
                            if (!string.IsNullOrEmpty(userTimeZone))
                            {
                                // Add timezone as a claim
                                var identity = context.User.Identity as ClaimsIdentity;
                                identity?.AddClaim(new Claim("strTimeZone", userTimeZone));
                                
                                _logger.LogDebug($"Added timezone claim: {userTimeZone} for user {userGuid}");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Log error but don't block the request
                    _logger.LogError(ex, "Error while retrieving timezone information");
                }
            }

            // Continue with the request
            await _next(context);
        }

        private async Task<string> GetUserTimeZoneAsync(AppDbContext dbContext, string userGuid)
        {
            // Get the timezone directly from the user
            var timezone = await dbContext.MstUsers
                .Where(u => u.strUserGUID == GuidHelper.ToGuid(userGuid) && u.bolIsActive)
                .Select(u => u.strTimeZone)
                .FirstOrDefaultAsync();

            return timezone ?? AuditSoftware.Helpers.DateTimeProvider.DefaultTimeZone;
        }
    }
}
