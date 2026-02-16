using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.UserRole;

public class UserRoleCreateDto
{
    [Required(ErrorMessage = "Role name is required")]
    [StringLength(100, ErrorMessage = "Role name cannot exceed 100 characters")]
    public required string strName { get; set; }

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? strDesc { get; set; }

    public bool bolIsActive { get; set; } = true;
} 