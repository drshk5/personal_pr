using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace AuditSoftware.Services
{
    /// <summary>
    /// Provides secure hashing for refresh tokens and other sensitive data
    /// Uses HMAC-SHA256 for compatibility and speed
    /// </summary>
    public class TokenHashService
    {
        // Fixed secret key for consistent hashing across application restarts
        // This is a fallback if configuration is not available
        private static readonly byte[] DefaultSecretKey = Encoding.UTF8.GetBytes("RefreshTokenHashingSecretKey!@#$%^&*()_+1234567890");

        private static IConfiguration? _configuration;

        /// <summary>
        /// Initialize the service with configuration (call this from Program.cs or Startup)
        /// </summary>
        public static void Initialize(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Get the secret key from configuration or use default
        /// </summary>
        private static byte[] GetSecretKey()
        {
            if (_configuration != null)
            {
                var key = _configuration["Jwt:TokenHmacKey"];
                if (!string.IsNullOrEmpty(key))
                {
                    return Encoding.UTF8.GetBytes(key);
                }
            }
            return DefaultSecretKey;
        }

        /// <summary>
        /// Hash a refresh token using HMAC-SHA256 with a fixed secret key
        /// The resulting hash is safe to store in the database
        /// </summary>
        public static string HashToken(string token)
        {
            if (string.IsNullOrEmpty(token))
                throw new ArgumentNullException(nameof(token));

            var secretKey = GetSecretKey();
            using (var hmac = new HMACSHA256(secretKey))
            {
                byte[] tokenBytes = Encoding.UTF8.GetBytes(token);
                byte[] hashBytes = hmac.ComputeHash(tokenBytes);
                return Convert.ToHexString(hashBytes);
            }
        }

        /// <summary>
        /// Hash a refresh token using a specific secret key
        /// More secure than unhashed variant (prevents offline attacks)
        /// </summary>
        public static string HashToken(string token, byte[] secretKey)
        {
            if (string.IsNullOrEmpty(token))
                throw new ArgumentNullException(nameof(token));
            if (secretKey == null || secretKey.Length == 0)
                throw new ArgumentNullException(nameof(secretKey));

            using (var hmac = new HMACSHA256(secretKey))
            {
                byte[] tokenBytes = Encoding.UTF8.GetBytes(token);
                byte[] hashBytes = hmac.ComputeHash(tokenBytes);
                return Convert.ToHexString(hashBytes);
            }
        }

        /// <summary>
        /// Verify that a token matches a previously computed hash
        /// Uses constant-time comparison to prevent timing attacks
        /// </summary>
        public static bool VerifyToken(string token, string storedHash)
        {
            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(storedHash))
                return false;

            string computedHash = HashToken(token);
            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(computedHash),
                Encoding.UTF8.GetBytes(storedHash)
            );
        }

        /// <summary>
        /// Verify that a token matches a previously computed hash using a secret key
        /// Uses constant-time comparison to prevent timing attacks
        /// </summary>
        public static bool VerifyToken(string token, string storedHash, byte[] secretKey)
        {
            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(storedHash))
                return false;

            string computedHash = HashToken(token, secretKey);
            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(computedHash),
                Encoding.UTF8.GetBytes(storedHash)
            );
        }
    }
}
