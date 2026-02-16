using System;
using System.Collections.Generic;
using System.Linq;
using TimeZoneConverter;

namespace AuditSoftware.Helpers
{
    /// <summary>
    /// Helper class for timezone conversions between IANA (used by most systems) and Windows timezones
    /// </summary>
    public static class TimeZoneHelper
    {
        /// <summary>
        /// Converts an IANA timezone ID to Windows timezone ID
        /// </summary>
        /// <param name="ianaId">The IANA timezone ID (e.g. "Asia/Kolkata")</param>
        /// <returns>The Windows timezone ID (e.g. "India Standard Time")</returns>
        public static string ConvertIanaToWindowsTimeZone(string ianaId)
        {
            try
            {
                // If the timezone is already in Windows format, return it
                if (TimeZoneInfo.FindSystemTimeZoneById(ianaId) != null)
                {
                    return ianaId;
                }
            }
            catch
            {
                // If the timezone isn't a valid Windows timezone, continue with conversion
            }

            try
            {
                return TZConvert.IanaToWindows(ianaId);
            }
            catch (Exception)
            {
                // If conversion fails, default to India Standard Time
                return "India Standard Time";
            }
        }

        /// <summary>
        /// Converts a Windows timezone ID to IANA timezone ID
        /// </summary>
        /// <param name="windowsId">The Windows timezone ID (e.g. "India Standard Time")</param>
        /// <returns>The IANA timezone ID (e.g. "Asia/Kolkata")</returns>
        public static string ConvertWindowsToIanaTimeZone(string windowsId)
        {
            try
            {
                return TZConvert.WindowsToIana(windowsId);
            }
            catch (Exception)
            {
                // If conversion fails, default to Asia/Kolkata
                return "Asia/Kolkata";
            }
        }
    }
}
