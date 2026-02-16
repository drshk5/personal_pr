using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.TaxRate
{
    public class TaxRateCreateDto
    {
        [Required(ErrorMessage = "Tax type is required")]
        public string strTaxTypeGUID { get; set; }

        [Required(ErrorMessage = "Tax category is required")]
        public string strTaxCategoryGUID { get; set; }

        [Required(ErrorMessage = "Schedule is required")]
        public string strScheduleGUID { get; set; }

        [Required(ErrorMessage = "Tax rate name is required")]
        [MaxLength(100, ErrorMessage = "Tax rate name cannot exceed 100 characters")]
        public string strTaxRateName { get; set; }
        
        [Required(ErrorMessage = "Tax percentage is required")]
        [Range(0, 100, ErrorMessage = "Tax percentage must be between 0 and 100")]
        public decimal decTaxPercentage { get; set; }

        [Required(ErrorMessage = "Tax rate code is required")]
        [MaxLength(50, ErrorMessage = "Tax rate code cannot exceed 50 characters")]
        public string strTaxRateCode { get; set; }
        
        public string? strStateGUID { get; set; }
        
        public int intDisplayOrder { get; set; } = 0;
        
        public DateTime? dtEffectiveFrom { get; set; }
        
        public DateTime? dtEffectiveTo { get; set; }
        
        public bool bolIsActive { get; set; } = true;
    }
}
