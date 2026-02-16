using System;

namespace AuditSoftware.DTOs.TaxRate
{
    public class TaxRateSimpleDto
    {
        public string strTaxRateGUID { get; set; } = string.Empty;
        public string strTaxRateName { get; set; } = string.Empty;
        public string strTaxRateCode { get; set; } = string.Empty;
        public decimal decTaxPercentage { get; set; }
        public string? strTaxTypeName { get; set; }
        public string? strTaxCategoryName { get; set; }
        public string? strStateName { get; set; }
    }
}
