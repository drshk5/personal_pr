using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Designation
{
    public class DesignationUpdateDto
    {
        [Required(ErrorMessage = "Designation name is required")]
        [MaxLength(450, ErrorMessage = "Designation name cannot exceed 450 characters")]
        public string strName { get; set; }
        
        public bool bolIsActive { get; set; }
    }
}
