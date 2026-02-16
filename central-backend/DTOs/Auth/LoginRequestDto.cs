using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Auth
{
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string strEmailId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        public string strPassword { get; set; } = string.Empty;
        
    /// <summary>
    /// When true, force login by invalidating existing sessions for this user.
    /// Frontend will set this after user confirms.
    /// </summary>
    public bool bolIsForce { get; set; } = false;
    }
} 