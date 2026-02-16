using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Department
{
    public class DepartmentCreateDto
    {
        [Required(ErrorMessage = "Department name is required")]
        [MaxLength(450, ErrorMessage = "Department name cannot exceed 450 characters")]
        public string strDepartmentName { get; set; }

        public bool bolsActive { get; set; } = true;
    }
}
