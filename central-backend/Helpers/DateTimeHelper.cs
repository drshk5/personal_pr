using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.Helpers
{
    /// <summary>
    /// Helper class for DateTime operations in the application
    /// </summary>
    public static class DateTimeHelper
    {
        /// <summary>
        /// Gets the current time in UTC
        /// </summary>
        /// <returns>Current DateTime in UTC</returns>
        public static DateTime GetCurrentUtcTime()
        {
            return DateTimeProvider.Now;
        }
        
        /// <summary>
        /// Gets the current time for the specified timezone
        /// </summary>
        /// <param name="timeZoneId">The timezone to use, defaults to Asia/Kolkata if not provided</param>
        /// <returns>Current DateTime in the specified timezone</returns>
        public static DateTime GetCurrentTimeInZone(string timeZoneId = DateTimeProvider.DefaultTimeZone)
        {
            return DateTimeProvider.GetCurrentTimeInZone(timeZoneId);
        }
        
        /// <summary>
        /// Gets the current year based on UTC time
        /// </summary>
        /// <returns>Current year as an integer</returns>
        public static int GetCurrentYear()
        {
            return DateTimeProvider.CurrentYear;
        }
        
        /// <summary>
        /// Gets the timezone from the HttpContext, if available
        /// Otherwise, returns the default timezone
        /// </summary>
        public static string GetTimezoneFromContext(HttpContext context)
        {
            // Try to get organization timezone from claims
            var timeZoneClaim = context?.User?.FindFirst("strTimeZone");
            return timeZoneClaim?.Value ?? DateTimeProvider.DefaultTimeZone;
        }

        /// <summary>
        /// Converts a DateTime to the specified timezone
        /// </summary>
        /// <param name="dateTime">The DateTime to convert</param>
        /// <param name="timeZoneId">Target timezone ID (IANA format)</param>
        /// <returns>The DateTime in the specified timezone</returns>
        public static DateTime ConvertToTimeZone(DateTime dateTime, string timeZoneId = DateTimeProvider.DefaultTimeZone)
        {
            try
            {
                // Ensure the input is treated as UTC if not already
                if (dateTime.Kind != DateTimeKind.Utc)
                {
                    dateTime = DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
                }

                // Get the timezone info for the target timezone
                var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(
                    TimeZoneHelper.ConvertIanaToWindowsTimeZone(timeZoneId));

                // Convert the UTC time to the target timezone
                return TimeZoneInfo.ConvertTimeFromUtc(dateTime, timeZoneInfo);
            }
            catch (Exception)
            {
                // If conversion fails, return the original date
                return dateTime;
            }
        }

        /// <summary>
        /// Converts a nullable UTC DateTime to the specified timezone
        /// </summary>
        /// <param name="dateTime">The nullable DateTime to convert (assumed UTC)</param>
        /// <param name="timeZoneId">Target timezone ID (IANA format)</param>
        /// <returns>The nullable DateTime in the specified timezone</returns>
        public static DateTime? ConvertToTimeZone(DateTime? dateTime, string timeZoneId = DateTimeProvider.DefaultTimeZone)
        {
            if (!dateTime.HasValue)
                return null;

            return ConvertToTimeZone(dateTime.Value, timeZoneId);
        }
    }
}
