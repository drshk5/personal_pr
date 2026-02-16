using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Year
{
    public class YearCreateDto
    {
        [Required]
        [StringLength(100)]
        public string strName { get; set; } = string.Empty;
        
        [Required]
        public DateTime dtStartDate { get; set; }
        
        [Required]
        public DateTime dtEndDate { get; set; }
        
        public bool bolIsActive { get; set; }
        
        public Guid? strPreviousYearGUID { get; set; } = null;
        
        public Guid? strNextYearGUID { get; set; } = null;
    }
} 