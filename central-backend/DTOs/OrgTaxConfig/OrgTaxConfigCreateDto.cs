using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.OrgTaxConfig
{
    public class OrgTaxConfigCreateDto
    {
        [Required(ErrorMessage = "Organization GUID is required")]
        public string strOrganizationGUID { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tax Type GUID is required")]
        public string strTaxTypeGUID { get; set; } = string.Empty;

        [MaxLength(50, ErrorMessage = "Tax Registration Number cannot exceed 50 characters")]
        public string? strTaxRegNo { get; set; }

        public string? strStateGUID { get; set; }

        public DateTime? dtRegistrationDate { get; set; }

        public bool bolIsActive { get; set; } = true;

        public string? jsonSettings { get; set; }
    }
}
