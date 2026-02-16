namespace AuditSoftware.DTOs.Auth
{
    public class LoginResponseDto
    {
        public string? Token { get; set; }
        
        /// <summary>
        /// Refresh token (if not stored in cookie)
        /// When RefreshTokenInCookie is true, this will be null (client will use cookie instead)
        /// </summary>
        public string? RefreshToken { get; set; }

        /// <summary>
        /// Indicates if refresh token is stored in HttpOnly cookie instead of response body
        /// If true, client should not look for RefreshToken in response and should use cookie automatically
        /// </summary>
        public bool RefreshTokenInCookie { get; set; } = false;

        public string strUserGUID { get; set; } = string.Empty;
        public string strName { get; set; } = string.Empty;
        public string strEmailId { get; set; } = string.Empty;
        public string strMobileNo { get; set; } = string.Empty;
        public string? strGroupGUID { get; set; }
        public string? strLastOrganizationGUID { get; set; }
        public string? strRoleGUID { get; set; }
        // Keep the old property for backward compatibility
        public string? strLastYearGUID { get; set; }
        public string? strTimeZone { get; set; }
        public string? strConnectionString { get; set; }
        // Indicates whether previous sessions were revoked during this login
        public bool PreviousSessionRevoked { get; set; } = false;

        // Optional human-readable session message (e.g., "Your older session was signed out")
        public string? SessionMessage { get; set; }
    }
}