using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.LegalStatusType
{
    public class LegalStatusTypeUpdateDto
    {
        [Required(ErrorMessage = "Legal status type name is required")]
        [MaxLength(450, ErrorMessage = "Legal status type name cannot exceed 450 characters")]
        public string strName { get; set; }
        
        public bool bolIsActive { get; set; }
    }
}
