using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.TaxType
{
    public class TaxTypeUpdateDto
    {
        [Required(ErrorMessage = "Tax type code is required")]
        [MaxLength(50, ErrorMessage = "Tax type code cannot exceed 50 characters")]
        public string strTaxTypeCode { get; set; }

        [Required(ErrorMessage = "Tax type name is required")]
        [MaxLength(100, ErrorMessage = "Tax type name cannot exceed 100 characters")]
        public string strTaxTypeName { get; set; }
        
        [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? strDescription { get; set; }
        
        [Required(ErrorMessage = "Country is required")]
        public string strCountryGUID { get; set; }
        
        public bool bolIsCompound { get; set; }
        
        public bool bolIsActive { get; set; }
    }
}
