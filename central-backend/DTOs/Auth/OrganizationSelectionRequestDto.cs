using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Auth
{
    public class OrganizationSelectionRequestDto
    {
        [Required]
        public string strOrganizationGUID { get; set; } = string.Empty;
        
        public string? strYearGUID { get; set; }
    }
} 