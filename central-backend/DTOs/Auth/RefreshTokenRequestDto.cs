using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Auth
{
    public class RefreshTokenRequestDto
    {
        [Required]
        public string Token { get; set; }
        [Required]
        public string RefreshToken { get; set; }
    }
} 