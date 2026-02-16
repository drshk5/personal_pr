using System;

namespace AuditSoftware.DTOs.TaxType
{
    public class TaxTypeResponseDto
    {
        public string strTaxTypeGUID { get; set; } = string.Empty;
        public string strTaxTypeCode { get; set; } = string.Empty;
        public string strTaxTypeName { get; set; } = string.Empty;
        public string? strDescription { get; set; }
        public string strCountryGUID { get; set; } = string.Empty;
        public string? strCountryName { get; set; }
        public bool bolIsCompound { get; set; }
        public bool bolIsActive { get; set; }
        public DateTime dtCreatedOn { get; set; }
        public string? strCreatedByName { get; set; }
        public DateTime? dtUpdatedOn { get; set; }
        public string? strUpdatedByName { get; set; }
    }
}
