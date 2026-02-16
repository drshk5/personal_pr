using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using AuditSoftware.Exceptions;

namespace AuditSoftware.Services
{
    /// <summary>
    /// Provides AES-256-GCM authenticated encryption/decryption
    /// GCM mode provides both confidentiality and authenticity
    /// </summary>
    public class EncryptionService
    {
        private readonly ILogger<EncryptionService> _logger;
        private const int GcmTagSize = 16; // 128 bits
        private const int IvSize = 12; // 96 bits (standard for GCM)
        private const int KeySize = 32; // 256 bits

        public EncryptionService(ILogger<EncryptionService> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Encrypts data using AES-256-GCM with authenticated tag
        /// Format: [IV (12 bytes)] + [Ciphertext] + [AuthTag (16 bytes)]
        /// All base64url encoded
        /// </summary>
        public string EncryptGcm(string plaintext, byte[] key)
        {
            if (string.IsNullOrEmpty(plaintext))
                throw new ArgumentNullException(nameof(plaintext));
            if (key == null || key.Length != KeySize)
                throw new ArgumentException($"Key must be exactly {KeySize} bytes (256 bits)");

            try
            {
                using (var aes = new AesGcm(key, GcmTagSize))
                {
                    // Generate random IV (96 bits for GCM)
                    byte[] iv = new byte[IvSize];
                    using (var rng = RandomNumberGenerator.Create())
                    {
                        rng.GetBytes(iv);
                    }

                    // Prepare plaintext
                    byte[] plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
                    
                    // Initialize output: will contain ciphertext + auth tag
                    byte[] ciphertextAndTag = new byte[plaintextBytes.Length + GcmTagSize];
                    byte[] authTag = new byte[GcmTagSize];

                    // Encrypt and generate authentication tag
                    aes.Encrypt(iv, plaintextBytes, ciphertextAndTag.AsSpan(0, plaintextBytes.Length), authTag);

                    // Append auth tag to ciphertext
                    Array.Copy(authTag, 0, ciphertextAndTag, plaintextBytes.Length, GcmTagSize);

                    // Combine IV + Ciphertext + AuthTag
                    byte[] result = new byte[IvSize + ciphertextAndTag.Length];
                    Array.Copy(iv, 0, result, 0, IvSize);
                    Array.Copy(ciphertextAndTag, 0, result, IvSize, ciphertextAndTag.Length);

                    // Return as Base64Url (URL-safe encoding)
                    return Base64UrlEncode(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during AES-GCM encryption");
                throw new BusinessException("Error during token encryption");
            }
        }

        /// <summary>
        /// Decrypts AES-256-GCM encrypted data
        /// Verifies authentication tag before decryption
        /// </summary>
        public string DecryptGcm(string encryptedBase64Url, byte[] key)
        {
            if (string.IsNullOrEmpty(encryptedBase64Url))
                throw new ArgumentNullException(nameof(encryptedBase64Url));
            if (key == null || key.Length != KeySize)
                throw new ArgumentException($"Key must be exactly {KeySize} bytes (256 bits)");

            try
            {
                // Decode from Base64Url
                byte[] fullData = Base64UrlDecode(encryptedBase64Url);

                if (fullData.Length < IvSize + GcmTagSize)
                    throw new ArgumentException("Invalid encrypted data format");

                // Extract components
                byte[] iv = new byte[IvSize];
                Array.Copy(fullData, 0, iv, 0, IvSize);

                int ciphertextLength = fullData.Length - IvSize - GcmTagSize;
                byte[] ciphertext = new byte[ciphertextLength];
                Array.Copy(fullData, IvSize, ciphertext, 0, ciphertextLength);

                byte[] authTag = new byte[GcmTagSize];
                Array.Copy(fullData, IvSize + ciphertextLength, authTag, 0, GcmTagSize);

                using (var aes = new AesGcm(key, GcmTagSize))
                {
                    byte[] plaintext = new byte[ciphertextLength];
                    
                    // Decrypt and verify authentication tag
                    aes.Decrypt(iv, ciphertext, authTag, plaintext);

                    return Encoding.UTF8.GetString(plaintext);
                }
            }
            catch (CryptographicException ex)
            {
                _logger.LogError(ex, "Authentication tag verification failed - possible tampering detected");
                throw new BusinessException("Token authentication failed. Data may have been tampered with.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during AES-GCM decryption");
                throw new BusinessException("Error during token decryption");
            }
        }

        /// <summary>
        /// Base64Url encode (RFC 4648 Section 5)
        /// Replaces + with -, / with _, and removes padding =
        /// </summary>
        private string Base64UrlEncode(byte[] data)
        {
            string base64 = Convert.ToBase64String(data);
            return base64.Replace("+", "-").Replace("/", "_").TrimEnd('=');
        }

        /// <summary>
        /// Base64Url decode (RFC 4648 Section 5)
        /// Restores + from -, / from _, and adds padding
        /// </summary>
        private byte[] Base64UrlDecode(string base64Url)
        {
            string base64 = base64Url.Replace("-", "+").Replace("_", "/");
            
            // Add padding if needed
            switch (base64.Length % 4)
            {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }

            return Convert.FromBase64String(base64);
        }

        /// <summary>
        /// Validates that a key is exactly 32 bytes
        /// Used during configuration validation
        /// </summary>
        public static void ValidateKey(byte[] key, string keyName)
        {
            if (key == null || key.Length != KeySize)
                throw new InvalidOperationException($"{keyName} must be exactly {KeySize} bytes (256 bits)");
        }
    }
}
