using System;

namespace AuditSoftware.Services
{
    /// <summary>
    /// Base class for all services to provide standardized DateTime handling
    /// </summary>
    public abstract class ServiceBase
    {
        /// <summary>
        /// Gets the current time in UTC format for database storage
        /// </summary>
        protected DateTime CurrentDateTime => Helpers.DateTimeProvider.Now;
        
        /// <summary>
        /// Gets the current year in IST
        /// </summary>
        protected int CurrentYear => Helpers.DateTimeProvider.CurrentYear;
        
        /// <summary>
        /// Format a date for display (dd-MMM-yyyy format)
        /// </summary>
        protected string FormatDate(DateTime? date) => date?.ToString("dd-MMM-yyyy") ?? string.Empty;
        
        /// <summary>
        /// Format a datetime for display (dd-MMM-yyyy hh:mm:ss tt format)
        /// </summary>
        protected string FormatDateTime(DateTime? dateTime) => dateTime?.ToString("dd-MMM-yyyy hh:mm:ss tt") ?? string.Empty;
        
        /// <summary>
        /// Creates a DateTime value with the specified offset in minutes from the current time
        /// </summary>
        protected DateTime GetDateTimeWithOffset(int minutesOffset) 
        {
            return Helpers.DateTimeProvider.Now.AddMinutes(minutesOffset);
        }
        
        /// <summary>
        /// Creates a DateTime value with the specified offset in days from the current time
        /// </summary>
        protected DateTime GetDateTimeWithDaysOffset(int daysOffset) 
        {
            return Helpers.DateTimeProvider.Now.AddDays(daysOffset);
        }
        
        /// <summary>
        /// Gets access token expiration time based on configuration
        /// </summary>
        protected DateTime GetAccessTokenExpiration(IConfiguration configuration)
        {
            int minutes = 15; // Default value
            if (configuration != null)
            {
                minutes = configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 15);
            }
            return GetDateTimeWithOffset(minutes);
        }
        
        /// <summary>
        /// Gets refresh token expiration time based on configuration
        /// </summary>
        protected DateTime GetRefreshTokenExpiration(IConfiguration configuration)
        {
            int days = 7; // Default value
            if (configuration != null)
            {
                days = configuration.GetValue<int>("Jwt:RefreshTokenExpirationDays", 7);
            }
            return GetDateTimeWithDaysOffset(days);
        }
        
        /// <summary>
        /// Gets session expiration timespan based on configuration
        /// </summary>
        protected TimeSpan GetSessionExpirationTimeSpan(IConfiguration configuration)
        {
            int minutes = 15; // Default value
            if (configuration != null)
            {
                minutes = configuration.GetValue<int>("Jwt:SessionExpirationMinutes", 15);
            }
            return TimeSpan.FromMinutes(minutes);
        }
    }
}
