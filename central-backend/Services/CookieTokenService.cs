using Microsoft.AspNetCore.Http;
using System;

namespace AuditSoftware.Services
{
    /// <summary>
    /// Service for managing secure refresh token storage in HttpOnly cookies
    /// Provides methods for setting, retrieving, and clearing refresh tokens from cookies
    /// </summary>
    public interface ICookieTokenService
    {
        /// <summary>
        /// Sets refresh token in a secure HttpOnly cookie
        /// </summary>
        /// <param name="response">HttpResponse to set cookie on</param>
        /// <param name="refreshToken">The refresh token (plaintext) to store</param>
        /// <param name="expiryDate">Expiration date for the token and cookie</param>
        void SetRefreshTokenCookie(HttpResponse response, string refreshToken, DateTime expiryDate);

        /// <summary>
        /// Retrieves refresh token from request cookies
        /// </summary>
        /// <param name="request">HttpRequest to retrieve cookie from</param>
        /// <returns>Refresh token from cookie or null if not present</returns>
        string? GetRefreshTokenFromCookie(HttpRequest request);

        /// <summary>
        /// Clears refresh token cookie (logout)
        /// </summary>
        /// <param name="response">HttpResponse to clear cookie on</param>
        void ClearRefreshTokenCookie(HttpResponse response);
    }

    public class CookieTokenService : ICookieTokenService
    {
        /// <summary>
        /// Name of the refresh token cookie
        /// </summary>
        private const string REFRESH_TOKEN_COOKIE_NAME = "X-Refresh-Token";

        /// <summary>
        /// Path for the cookie (API endpoints only)
        /// </summary>
        private const string COOKIE_PATH = "/api";

        /// <summary>
        /// Cookie options configuration for security
        /// </summary>
        private static CookieOptions GetCookieOptions(DateTime expiryDate, bool isDevelopment)
        {
            return new CookieOptions
            {
                // Security: HttpOnly prevents JavaScript access (XSS protection)
                HttpOnly = true,

                // Security: Secure means cookie only sent over HTTPS (except in Development)
                Secure = !isDevelopment,

                // Security: Strict prevents CSRF attacks (require same-site origin)
                SameSite = SameSiteMode.Strict,

                // Set cookie path to API endpoints only
                Path = COOKIE_PATH,

                // Set expiration to match token expiry
                Expires = expiryDate
            };
        }

        /// <summary>
        /// Sets refresh token in a secure HttpOnly cookie
        /// Cookie is marked as HttpOnly (JavaScript cannot access), Secure (HTTPS only in production),
        /// and SameSite=Strict (prevents CSRF attacks)
        /// </summary>
        public void SetRefreshTokenCookie(HttpResponse response, string refreshToken, DateTime expiryDate)
        {
            if (response == null)
                throw new ArgumentNullException(nameof(response));

            if (string.IsNullOrEmpty(refreshToken))
                throw new ArgumentException("Refresh token cannot be empty", nameof(refreshToken));

            var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
            var cookieOptions = GetCookieOptions(expiryDate, isDevelopment);

            response.Cookies.Append(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookieOptions);
        }

        /// <summary>
        /// Retrieves refresh token from request cookies
        /// </summary>
        public string? GetRefreshTokenFromCookie(HttpRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            request.Cookies.TryGetValue(REFRESH_TOKEN_COOKIE_NAME, out var token);
            return token;
        }

        /// <summary>
        /// Clears refresh token cookie by setting expiration to past date
        /// </summary>
        public void ClearRefreshTokenCookie(HttpResponse response)
        {
            if (response == null)
                throw new ArgumentNullException(nameof(response));

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") != "Development",
                SameSite = SameSiteMode.Strict,
                Path = COOKIE_PATH,
                Expires = DateTime.UtcNow.AddDays(-1)  // Past date to delete cookie
            };

            response.Cookies.Append(REFRESH_TOKEN_COOKIE_NAME, "", cookieOptions);
        }
    }
}
