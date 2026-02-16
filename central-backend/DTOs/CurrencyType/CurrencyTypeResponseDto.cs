using System;

namespace AuditSoftware.DTOs.CurrencyType
{
    public class CurrencyTypeResponseDto
    {
        public string strCurrencyTypeGUID { get; set; } = string.Empty;
        public string strName { get; set; } = string.Empty;
        public string? strCountryGUID { get; set; }
        public string? strCountryName { get; set; }
        public bool bolIsActive { get; set; }
    }
}
