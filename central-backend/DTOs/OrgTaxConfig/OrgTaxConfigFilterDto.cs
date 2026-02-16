using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.OrgTaxConfig
{
    public class OrgTaxConfigFilterDto : BaseFilterDto
    {
        public bool? IsActive { get; set; }
        public string? OrganizationGUID { get; set; }
        public string? TaxTypeGUID { get; set; }
        public string? StateGUID { get; set; }
        public string? SearchTerm { get; set; }
    }
}
