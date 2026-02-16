using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Auth
{
    public class DecodeTokenRequestDto
    {
        [Required(ErrorMessage = "Encrypted token is required")]
        public string EncryptedToken { get; set; } = string.Empty;
    }
}
