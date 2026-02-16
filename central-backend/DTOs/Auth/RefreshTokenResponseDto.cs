namespace AuditSoftware.DTOs.Auth
{
    /// <summary>
    /// Minimal response DTO for refresh token endpoint
    /// Only returns the new access token
    /// Refresh token is automatically set in HttpOnly cookie by the server
    /// </summary>
    public class RefreshTokenResponseDto
    {
        /// <summary>
        /// New encrypted access token
        /// </summary>
        public string Token { get; set; } = string.Empty;
    }
}
