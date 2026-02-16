using System;

namespace AuditSoftware.DTOs.TaxRate
{
    public class TaxRateResponseDto
    {
        public string strTaxRateGUID { get; set; } = string.Empty;
        public string strTaxTypeGUID { get; set; } = string.Empty;
        public string? strTaxTypeName { get; set; }
        public string? strTaxTypeCode { get; set; }
        public string strTaxCategoryGUID { get; set; } = string.Empty;
        public string? strTaxCategoryName { get; set; }
        public string strScheduleGUID { get; set; } = string.Empty;
        public string? strScheduleName { get; set; }
        public string strTaxRateName { get; set; } = string.Empty;
        public decimal decTaxPercentage { get; set; }
        public string strTaxRateCode { get; set; } = string.Empty;
        public string? strStateGUID { get; set; }
        public string? strStateName { get; set; }
        public int intDisplayOrder { get; set; }
        public DateTime? dtEffectiveFrom { get; set; }
        public DateTime? dtEffectiveTo { get; set; }
        public bool bolIsActive { get; set; }
        public DateTime dtCreatedOn { get; set; }
        public string? strCreatedByName { get; set; }
        public DateTime? dtUpdatedOn { get; set; }
        public string? strUpdatedByName { get; set; }
    }
}
