using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Auth
{
    public class TokenValidationRequestDto
    {
        [Required]
        public string Token { get; set; }
    }
} 