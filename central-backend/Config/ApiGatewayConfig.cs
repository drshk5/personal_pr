using Microsoft.Extensions.Configuration;

namespace AuditSoftware.Config
{
    public class ApiGatewayConfig
    {
        public string TaskServiceBaseUrl { get; set; } = string.Empty;
        public string HrmServiceBaseUrl { get; set; } = string.Empty;
        public string AuditServiceBaseUrl { get; set; } = string.Empty;
        public string AccountingServiceBaseUrl { get; set; } = string.Empty;
        public string CrmServiceBaseUrl { get; set; } = string.Empty;
    }

    public static class ApiGatewayConfigExtensions
    {
        public static void AddApiGatewayConfig(this IServiceCollection services, IConfiguration configuration)
        {
            var apiGatewayConfig = new ApiGatewayConfig();
            configuration.GetSection("ApiGateway").Bind(apiGatewayConfig);
            services.AddSingleton(apiGatewayConfig);

            // Configure HttpClient with SSL certificate validation bypass for development
            services.AddHttpClient("ApiGatewayClient", client =>
            {
                // Increased timeout for SignalR LongPolling connections (default 30s → 120s)
                // LongPolling keeps connections open waiting for messages
                client.Timeout = TimeSpan.FromSeconds(120);
            })
            .ConfigurePrimaryHttpMessageHandler(() =>
            {
                return new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = (message, cert, chain, errors) =>
                    {
                        // In development, accept all certificates
                        // TODO: For production, implement proper certificate validation
                        return true;
                    }
                };
            });
        }
    }
}
