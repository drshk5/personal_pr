using System;

namespace AuditSoftware.DTOs.TaxType
{
    public class TaxTypeSimpleDto
    {
        public string strTaxTypeGUID { get; set; } = string.Empty;
        public string strTaxTypeCode { get; set; } = string.Empty;
        public string strTaxTypeName { get; set; } = string.Empty;
        public string strCountryGUID { get; set; } = string.Empty;
        public string? strCountryName { get; set; }
        public bool bolIsCompound { get; set; }
    }
}
