using System;

namespace AuditSoftware.DTOs.OrgTaxConfig
{
    public class OrgTaxConfigSimpleDto
    {
        public string strOrgTaxConfigGUID { get; set; } = string.Empty;
        public string strOrganizationGUID { get; set; } = string.Empty;
        public string? strOrganizationName { get; set; }
        public string strTaxTypeGUID { get; set; } = string.Empty;
        public string? strTaxTypeName { get; set; }
        public string? strTaxRegNo { get; set; }
    }
}
