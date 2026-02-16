using System;

namespace AuditSoftware.Helpers
{
    public static class DeviceInfoParser
    {
        // Very small UA heuristic parser to produce a friendly summary. Avoids external deps.
        public static string? Parse(string? userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return null;

            try
            {
                string ua = userAgent;
                string browser = "Unknown Browser";
                string os = "Unknown OS";

                if (ua.Contains("Firefox", StringComparison.OrdinalIgnoreCase))
                    browser = "Firefox";
                else if (ua.Contains("Edg/", StringComparison.OrdinalIgnoreCase) || ua.Contains("Edge", StringComparison.OrdinalIgnoreCase))
                    browser = "Edge";
                else if (ua.Contains("OPR", StringComparison.OrdinalIgnoreCase) || ua.Contains("Opera", StringComparison.OrdinalIgnoreCase))
                    browser = "Opera";
                else if (ua.Contains("Chrome", StringComparison.OrdinalIgnoreCase) && !ua.Contains("Chromium", StringComparison.OrdinalIgnoreCase))
                    browser = "Chrome";
                else if (ua.Contains("Safari", StringComparison.OrdinalIgnoreCase) && !ua.Contains("Chrome", StringComparison.OrdinalIgnoreCase))
                    browser = "Safari";

                if (ua.Contains("Android", StringComparison.OrdinalIgnoreCase))
                    os = "Android";
                else if (ua.Contains("iPhone", StringComparison.OrdinalIgnoreCase) || ua.Contains("iPad", StringComparison.OrdinalIgnoreCase) || ua.Contains("iOS", StringComparison.OrdinalIgnoreCase))
                    os = "iOS";
                else if (ua.Contains("Windows", StringComparison.OrdinalIgnoreCase))
                    os = "Windows";
                else if (ua.Contains("Macintosh", StringComparison.OrdinalIgnoreCase) || ua.Contains("Mac OS X", StringComparison.OrdinalIgnoreCase))
                    os = "macOS";
                else if (ua.Contains("Linux", StringComparison.OrdinalIgnoreCase))
                    os = "Linux";

                var summary = $"{browser} on {os}";

                // Keep it reasonably short
                if (summary.Length > 200)
                    return summary.Substring(0, 200);

                return summary;
            }
            catch
            {
                return userAgent.Length > 200 ? userAgent.Substring(0, 200) : userAgent;
            }
        }
    }
}
