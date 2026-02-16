using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Auth
{
    public class ForgotPasswordRequestDto
    {
        [Required]
        [EmailAddress]
        public string strEmailId { get; set; }
    }
} 