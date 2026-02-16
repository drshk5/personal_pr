using System;

namespace AuditSoftware.Helpers
{
    /// <summary>
    /// Global DateTime provider for the application.
    /// This centralizes all datetime operations for the application.
    /// Uses UTC for storage and converts to the user's timezone for display.
    /// </summary>
    public static class DateTimeProvider
    {
        /// <summary>
        /// The default timezone ID if none is provided
        /// </summary>
        public const string DefaultTimeZone = "Asia/Kolkata";
        
        /// <summary>
        /// Gets the current UTC time.
        /// This should be used for all DateTime storage in the database.
        /// </summary>
        public static DateTime UtcNow => DateTime.UtcNow;

        /// <summary>
        /// Gets the current time in UTC.
        /// This replaces the previous Now property that returned IST.
        /// </summary>
        public static DateTime Now => DateTime.UtcNow;
        
        /// <summary>
        /// Gets the current time converted to a specified timezone.
        /// </summary>
        /// <param name="timeZoneId">IANA timezone identifier, e.g., "Asia/Kolkata"</param>
        /// <returns>Current time in the specified timezone</returns>
        public static DateTime GetCurrentTimeInZone(string timeZoneId = DefaultTimeZone)
        {
            try 
            {
                var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(ConvertIanaToWindowsTimeZone(timeZoneId));
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZoneInfo);
            }
            catch (Exception)
            {
                // If timezone is invalid, fallback to UTC
                return DateTime.UtcNow;
            }
        }

        /// <summary>
        /// Gets the current year in UTC
        /// </summary>
        public static int CurrentYear => Now.Year;

        /// <summary>
        /// Converts a UTC DateTime to the specified timezone
        /// </summary>
        /// <param name="utcTime">The UTC time to convert</param>
        /// <param name="timeZoneId">IANA timezone identifier, e.g., "Asia/Kolkata"</param>
        public static DateTime ToTimeZone(this DateTime utcTime, string timeZoneId = DefaultTimeZone)
        {
            // Only convert if the input is actually UTC
            if (utcTime.Kind == DateTimeKind.Utc)
            {
                try 
                {
                    var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(ConvertIanaToWindowsTimeZone(timeZoneId));
                    return TimeZoneInfo.ConvertTimeFromUtc(utcTime, timeZoneInfo);
                }
                catch (Exception)
                {
                    // If timezone is invalid, return as-is
                    return utcTime;
                }
            }
            
            // If not UTC, return as-is
            return utcTime;
        }

        /// <summary>
        /// Converts a local DateTime to UTC
        /// </summary>
        public static DateTime ToUtc(this DateTime localTime, string sourceTimeZoneId = DefaultTimeZone)
        {
            // If already UTC, return as-is
            if (localTime.Kind == DateTimeKind.Utc)
            {
                return localTime;
            }
            
            try 
            {
                var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(ConvertIanaToWindowsTimeZone(sourceTimeZoneId));
                return TimeZoneInfo.ConvertTimeToUtc(localTime, timeZoneInfo);
            }
            catch (Exception)
            {
                // If timezone is invalid, best guess conversion
                // This is not ideal but preserves some behavior for legacy code
                var offset = TimeZoneInfo.Local.GetUtcOffset(localTime);
                return DateTime.SpecifyKind(localTime.Subtract(offset), DateTimeKind.Utc);
            }
        }
        
        /// <summary>
        /// Formats a DateTime in a standard format for display in the user's timezone
        /// Format: "dd-MMM-yyyy hh:mm:ss tt" (e.g., "04-Aug-2025 05:30:00 PM")
        /// </summary>
        public static string FormatForDisplay(this DateTime dateTime, string timeZoneId = DefaultTimeZone)
        {
            // Convert to user's timezone if it's in UTC
            var localDateTime = dateTime.Kind == DateTimeKind.Utc ? ToTimeZone(dateTime, timeZoneId) : dateTime;
            return localDateTime.ToString("dd-MMM-yyyy hh:mm:ss tt");
        }
        
        /// <summary>
        /// Gets the current time formatted in display format for the given timezone
        /// </summary>
        public static string NowFormatted(string timeZoneId = DefaultTimeZone) 
            => GetCurrentTimeInZone(timeZoneId).ToString("dd-MMM-yyyy hh:mm:ss tt");
        
        /// <summary>
        /// Formats a date in a standard date format without time
        /// Format: "dd-MMM-yyyy" (e.g., "04-Aug-2025")
        /// </summary>
        public static string FormatDate(this DateTime dateTime, string timeZoneId = DefaultTimeZone)
        {
            // Convert to user's timezone if it's in UTC
            var localDateTime = dateTime.Kind == DateTimeKind.Utc ? ToTimeZone(dateTime, timeZoneId) : dateTime;
            return localDateTime.ToString("dd-MMM-yyyy");
        }
        
        #region Backward Compatibility Methods

        /// <summary>
        /// LEGACY: Converts a UTC DateTime to IST - For backward compatibility
        /// </summary>
        public static DateTime ToIst(this DateTime utcTime)
        {
            return ToTimeZone(utcTime, "Asia/Kolkata");
        }

        /// <summary>
        /// LEGACY: Formats a DateTime in a standard IST format for display - For backward compatibility
        /// </summary>
        public static string FormatIst(this DateTime dateTime)
        {
            return FormatForDisplay(dateTime, "Asia/Kolkata");
        }

        #endregion
        
        /// <summary>
        /// Helper method to convert IANA timezone IDs to Windows timezone IDs
        /// </summary>
        private static string ConvertIanaToWindowsTimeZone(string ianaTimeZoneId)
        {
            // Common mappings that cover most used timezones
            // For a production system, consider using a more complete mapping library
            return ianaTimeZoneId switch
            {
                "Asia/Kolkata" => "India Standard Time",
                "Asia/Calcutta" => "India Standard Time",
                "America/New_York" => "Eastern Standard Time",
                "America/Los_Angeles" => "Pacific Standard Time",
                "Europe/London" => "GMT Standard Time",
                "UTC" => "UTC",
                "Etc/UTC" => "UTC",
                "Europe/Paris" => "Romance Standard Time",
                "Asia/Tokyo" => "Tokyo Standard Time",
                "Australia/Sydney" => "AUS Eastern Standard Time",
                _ => "India Standard Time" // Default to IST if unknown
            };
        }
    }
}
