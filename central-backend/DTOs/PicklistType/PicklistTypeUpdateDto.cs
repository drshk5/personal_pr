using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.PicklistType
{
    public class PicklistTypeUpdateDto
    {
        [Required(ErrorMessage = "Picklist type is required")]
        [MaxLength(100, ErrorMessage = "Picklist type cannot exceed 100 characters")]
        public string strType { get; set; }
        
        [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? strDescription { get; set; }
        
        public bool bolIsActive { get; set; }
    }
} 