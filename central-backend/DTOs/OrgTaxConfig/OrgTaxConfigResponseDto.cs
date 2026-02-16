using System;

namespace AuditSoftware.DTOs.OrgTaxConfig
{
    public class OrgTaxConfigResponseDto
    {
        public string strOrgTaxConfigGUID { get; set; } = string.Empty;
        public string strOrganizationGUID { get; set; } = string.Empty;
        public string? strOrganizationName { get; set; }
        public string strTaxTypeGUID { get; set; } = string.Empty;
        public string? strTaxTypeName { get; set; }
        public string? strTaxTypeCode { get; set; }
        public string? strTaxRegNo { get; set; }
        public string? strStateGUID { get; set; }
        public string? strStateName { get; set; }
        public DateTime? dtRegistrationDate { get; set; }
        public bool bolIsActive { get; set; }
        public string? jsonSettings { get; set; }
        public string strCreatedByGUID { get; set; } = string.Empty;
        public DateTime dtCreatedDate { get; set; }
        
        // Formatted date properties for display
        public string strFormattedCreatedDate => AuditSoftware.Helpers.DateTimeProvider.ToIst(dtCreatedDate).ToString("dd-MMM-yyyy hh:mm:ss tt");
        public string? strFormattedRegistrationDate => dtRegistrationDate.HasValue ? AuditSoftware.Helpers.DateTimeProvider.ToIst(dtRegistrationDate.Value).ToString("dd-MMM-yyyy") : null;
    }
}
