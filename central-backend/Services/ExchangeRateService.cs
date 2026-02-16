using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AuditSoftware.Services
{
    public class ExchangeRateService : IExchangeRateService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ExchangeRateService> _logger;

        public ExchangeRateService(HttpClient httpClient, IConfiguration configuration, ILogger<ExchangeRateService> logger)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<decimal?> GetExchangeRateAsync(string fromCurrency, string toCurrency)
        {
            try
            {
                var baseUrl = _configuration["ThirdPartyApis:ExchangeRate:BaseUrl"];
                if (string.IsNullOrEmpty(baseUrl))
                {
                    _logger.LogError("Exchange rate API base URL not configured");
                    return null;
                }

                var url = $"{baseUrl}{fromCurrency.ToUpper()}";
                _logger.LogInformation($"Fetching exchange rate from: {url}");

                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Failed to fetch exchange rate. Status: {response.StatusCode}");
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var jsonDoc = JsonDocument.Parse(content);
                
                if (jsonDoc.RootElement.GetProperty("result").GetString() != "success")
                {
                    _logger.LogError("Exchange rate API returned unsuccessful result");
                    return null;
                }

                var rates = jsonDoc.RootElement.GetProperty("rates");
                if (rates.TryGetProperty(toCurrency.ToUpper(), out var rateElement))
                {
                    return rateElement.GetDecimal();
                }

                _logger.LogWarning($"Currency {toCurrency} not found in exchange rates");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching exchange rate from {fromCurrency} to {toCurrency}");
                return null;
            }
        }
    }

    public interface IExchangeRateService
    {
        Task<decimal?> GetExchangeRateAsync(string fromCurrency, string toCurrency);
    }
}
