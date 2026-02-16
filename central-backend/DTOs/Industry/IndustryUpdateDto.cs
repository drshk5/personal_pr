using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Industry
{
    public class IndustryUpdateDto
    {
        [Required(ErrorMessage = "Industry name is required")]
        [MaxLength(450, ErrorMessage = "Industry name cannot exceed 450 characters")]
        public string strName { get; set; } = string.Empty;
        
        public bool bolIsActive { get; set; }
    }
}
