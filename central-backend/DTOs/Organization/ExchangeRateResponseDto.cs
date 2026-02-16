namespace AuditSoftware.DTOs.Organization
{
    public class ExchangeRateResponseDto
    {
        public decimal Rate { get; set; }
        public string FromCurrency { get; set; } = string.Empty;
        public string ToCurrency { get; set; } = string.Empty;
        public string FromCurrencyName { get; set; } = string.Empty;
        public string ToCurrencyName { get; set; } = string.Empty;
    }
}
