using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Year
{
    public class YearUpdateDto
    {
        [Required(ErrorMessage = "Year name is required")]
        [StringLength(100, ErrorMessage = "Year name cannot exceed 100 characters")]
        public string strName { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Start date is required")]
        public DateTime dtStartDate { get; set; }
        
        [Required(ErrorMessage = "End date is required")]
        public DateTime dtEndDate { get; set; }
        
        public bool bolIsActive { get; set; }
        
        public Guid? strPreviousYearGUID { get; set; }
        
        public Guid? strNextYearGUID { get; set; }
    }
} 