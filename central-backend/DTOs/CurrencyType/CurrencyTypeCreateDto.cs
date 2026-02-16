using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.CurrencyType
{
    public class CurrencyTypeCreateDto
    {
        [Required(ErrorMessage = "Currency type name is required")]
        [MaxLength(450, ErrorMessage = "Currency type name cannot exceed 450 characters")]
        public string strName { get; set; } = string.Empty;
        
        public Guid? strCountryGUID { get; set; }
        
        public bool bolIsActive { get; set; } = true;
    }
}
