using AuditSoftware.Config;
using AuditSoftware.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace AuditSoftware.Services
{
    public interface IApiGatewayService
    {
        Task<HttpResponseMessage> ForwardRequestAsync(HttpContext context, string targetBaseUrl, string pathSuffix);
    }

    public class ApiGatewayService : IApiGatewayService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<ApiGatewayService> _logger;
        private readonly IAuthService _authService;
        
        private bool IsValidJwtToken(string token)
        {
            if (string.IsNullOrEmpty(token)) return false;
            
            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            try
            {
                return handler.CanReadToken(token);
            }
            catch
            {
                return false;
            }
        }

        public ApiGatewayService(
            IHttpClientFactory httpClientFactory, 
            ILogger<ApiGatewayService> logger,
            IAuthService authService)
        {
            _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
        }

        public async Task<HttpResponseMessage> ForwardRequestAsync(HttpContext context, string targetBaseUrl, string pathSuffix)
        {
            try
            {
                // Create HttpClient with SSL certificate validation bypass
                var httpClient = _httpClientFactory.CreateClient("ApiGatewayClient");
                
                // Build the target URL
                var targetUrl = $"{targetBaseUrl.TrimEnd('/')}/{pathSuffix.TrimStart('/')}";
                if (!string.IsNullOrEmpty(context.Request.QueryString.Value))
                {
                    targetUrl += context.Request.QueryString.Value;
                }
                
                _logger.LogInformation($"Forwarding request to: {targetUrl}");

                // Create the HTTP request message
                var requestMessage = new HttpRequestMessage
                {
                    Method = new HttpMethod(context.Request.Method),
                    RequestUri = new Uri(targetUrl)
                };

                // Copy headers from original request to forwarded request
                foreach (var header in context.Request.Headers)
                {
                    // Skip headers that are controlled by the HttpClient
                    if (!header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase) &&
                        !header.Key.Equals("Content-Length", StringComparison.OrdinalIgnoreCase))
                    {
                        requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                    }
                }
                
                // Add a special header to indicate the request is coming from the API Gateway
                requestMessage.Headers.TryAddWithoutValidation("X-Gateway-Source", "AuditBackend");
                
                // Standardize Authorization header for downstream: decrypt if needed
                string? authToken = null;
                if (context.Request.Headers.TryGetValue("Authorization", out var authValues))
                {
                    var rawAuth = authValues.FirstOrDefault();
                    authToken = rawAuth;
                    _logger.LogInformation("Found token in Authorization header");

                    // If bearer token is not a valid JWT, attempt decrypt
                    if (!string.IsNullOrEmpty(rawAuth) && rawAuth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        var bearerVal = rawAuth.Substring(7).Trim();
                        if (!IsValidJwtToken(bearerVal))
                        {
                            _logger.LogWarning("Authorization Bearer is not a valid JWT; attempting decrypt");
                            try
                            {
                                var decrypted = _authService.DecryptToken(bearerVal);
                                if (IsValidJwtToken(decrypted))
                                {
                                    authToken = $"Bearer {decrypted}";
                                    _logger.LogInformation("Successfully decrypted Authorization header to valid JWT");
                                }
                                else
                                {
                                    _logger.LogWarning("Decrypted Authorization token is not a valid JWT");
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to decrypt Authorization token");
                            }
                        }
                    }
                }
                // Forward Authorization and X-Forwarded-Auth if we have authToken
                if (!string.IsNullOrEmpty(authToken))
                {
                    _logger.LogInformation("Forwarding Authorization token to backend service");
                    requestMessage.Headers.Remove("Authorization");
                    requestMessage.Headers.TryAddWithoutValidation("Authorization", authToken);
                    requestMessage.Headers.Remove("X-Forwarded-Auth");
                    requestMessage.Headers.TryAddWithoutValidation("X-Forwarded-Auth", authToken);
                }
                else
                {
                    _logger.LogWarning("No Authorization token found to forward");
                }

                // Copy the request body if any
                if (context.Request.ContentLength > 0 || context.Request.Method == "POST" || context.Request.Method == "PUT" || context.Request.Method == "PATCH")
                {
                    // Create a memory stream to hold the request body
                    var memoryStream = new MemoryStream();
                    await context.Request.Body.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;

                    // Read the stream into a byte array
                    var bodyBytes = memoryStream.ToArray();
                    
                    // Create content from the byte array
                    var byteContent = new ByteArrayContent(bodyBytes);
                    
                    // Set content headers
                    if (context.Request.ContentType != null)
                    {
                        byteContent.Headers.ContentType = MediaTypeHeaderValue.Parse(context.Request.ContentType);
                    }
                    
                    requestMessage.Content = byteContent;
                    
                    // Reset the request body position so it can be read again later if needed
                    context.Request.Body.Position = 0;
                }

                // Send the request to the target service
                return await httpClient.SendAsync(requestMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error forwarding request");
                throw;
            }
        }
    }
}
