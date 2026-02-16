using AuditSoftware.Config;
using AuditSoftware.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace AuditSoftware.Middleware
{
    public class ApiGatewayMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ApiGatewayConfig _config;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ApiGatewayMiddleware> _logger;

        public ApiGatewayMiddleware(
            RequestDelegate next, 
            ApiGatewayConfig config,
            IServiceProvider serviceProvider,
            ILogger<ApiGatewayMiddleware> logger)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _config = config ?? throw new ArgumentNullException(nameof(config));
            _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value ?? "";
            _logger.LogInformation($"Processing request: {path}");
            
            // SignalR moved to dedicated hub-backend. Block old gateway hub paths.
            if (path.StartsWith("/api/task/hubs/", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning($"SignalR request blocked at gateway: {path}");
                context.Response.StatusCode = StatusCodes.Status410Gone;
                await context.Response.WriteAsync("SignalR hubs moved to hub-backend. Update client to use hub-backend URL.");
                return;
            }
            
            // Enable buffering so we can read the request body multiple times
            context.Request.EnableBuffering();
            
            // Check if the request is for a microservice endpoint
            bool isServiceRequest = path.StartsWith("/api/task", StringComparison.OrdinalIgnoreCase) ||
                                   path.StartsWith("/api/hrm", StringComparison.OrdinalIgnoreCase) ||
                                   path.StartsWith("/api/audit", StringComparison.OrdinalIgnoreCase) ||
                                   path.StartsWith("/api/accounting", StringComparison.OrdinalIgnoreCase) ||
                                   path.StartsWith("/api/crm", StringComparison.OrdinalIgnoreCase);
            
            // Define public endpoints that don't require authentication
            bool isPublicEndpoint = path.EndsWith("/WeatherForecast", StringComparison.OrdinalIgnoreCase) ||
                                   path.EndsWith("/WeatherForecast/", StringComparison.OrdinalIgnoreCase) ||
                                   path.Contains("WeatherForecast", StringComparison.OrdinalIgnoreCase) ||
                                   path.Contains("/swagger", StringComparison.OrdinalIgnoreCase) ||
                                   path.Contains("/health", StringComparison.OrdinalIgnoreCase);
            
            _logger.LogInformation($"Request path: {path}, isServiceRequest: {isServiceRequest}, isPublicEndpoint: {isPublicEndpoint}");

            // If this is a service request, check authentication first (unless it's a public endpoint)
            if (isServiceRequest && !isPublicEndpoint)
            {
                // Only trust framework authentication result (JwtBearer)
                var isAuthenticated = context.User.Identity?.IsAuthenticated == true;
                if (!isAuthenticated)
                {
                    _logger.LogWarning($"Unauthenticated request to service endpoint: {path}");
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsync("Authentication is required to access this endpoint.");
                    return;
                }

                _logger.LogInformation($"User is authenticated. Forwarding request to service: {path}");
            }

            // Now handle the forwarding based on path
            if (path.StartsWith("/api/task", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(_config.TaskServiceBaseUrl))
            {
                // Regular API: /api/task/Board -> /api/task/Board (no transformation needed)
                // Task backend controllers expect /api/task/[controller] routes
                var taskPath = path;
                _logger.LogInformation($"[API] Original path: {path}");
                _logger.LogInformation($"[API] Forwarding path unchanged: {taskPath}");
                _logger.LogInformation($"[API] Target URL: {_config.TaskServiceBaseUrl}{taskPath}");
                
                if (string.IsNullOrEmpty(taskPath) || taskPath == "/api")
                {
                    taskPath = "/";
                }
                
                await ForwardRequest(context, _config.TaskServiceBaseUrl, taskPath);
                return;
            }
            else if (path.StartsWith("/api/hrm", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(_config.HrmServiceBaseUrl))
            {
                await ForwardRequest(context, _config.HrmServiceBaseUrl, path);
                return;
            }
            else if (path.StartsWith("/api/audit", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(_config.AuditServiceBaseUrl))
            {
                await ForwardRequest(context, _config.AuditServiceBaseUrl, path);
                return;
            }
            else if (path.StartsWith("/api/accounting", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(_config.AccountingServiceBaseUrl))
            {
                // Forward the request to the accounting backend without rewriting the path
                // The accounting backend now uses /api/accounting/* routes directly
                _logger.LogInformation($"Forwarding accounting path '{path}'");
                await ForwardRequest(context, _config.AccountingServiceBaseUrl, path);
                return;
            }

            else if (path.StartsWith("/api/crm", StringComparison.OrdinalIgnoreCase)
                     && !string.IsNullOrEmpty(_config.CrmServiceBaseUrl))
            {
                _logger.LogInformation($"Forwarding CRM path '{path}'");
                await ForwardRequest(context, _config.CrmServiceBaseUrl, path);
                return;
            }

            // For all other paths, continue with the regular middleware pipeline
            await _next(context);
        }

        private async Task ForwardRequest(HttpContext context, string targetBaseUrl, string path)
        {
            try
            {
                _logger.LogInformation($"Forwarding request to {targetBaseUrl}, method: {context.Request.Method}");
                
                // Log important headers only to avoid overwhelming the logs
                var authHeader = context.Request.Headers["Authorization"].ToString();
                var contentType = context.Request.Headers["Content-Type"].ToString();
                var contentLength = context.Request.Headers["Content-Length"].ToString();
                _logger.LogInformation($"Request Auth header: {(string.IsNullOrEmpty(authHeader) ? "Not present" : "Present")}");
                _logger.LogInformation($"Request Content-Type: {contentType}");
                _logger.LogInformation($"Request Content-Length: {contentLength}");

                // Save the current position of the request body
                var originalBodyPosition = context.Request.Body.Position;
                context.Request.Body.Position = 0;

                // Get the ApiGatewayService from the request services (scoped)
                var apiGatewayService = context.RequestServices.GetRequiredService<IApiGatewayService>();
                
                // Forward the request to the target service
                var response = await apiGatewayService.ForwardRequestAsync(context, targetBaseUrl, path);
                
                _logger.LogInformation($"Response status: {(int)response.StatusCode} {response.StatusCode}");
                _logger.LogInformation($"Response Content-Type: {response.Content?.Headers.ContentType}");
                _logger.LogInformation($"Response Transfer-Encoding: {(response.Headers.TransferEncodingChunked == true ? "chunked" : "not chunked")}");

                // Copy the response status code
                context.Response.StatusCode = (int)response.StatusCode;

                // Copy the response headers
                foreach (var header in response.Headers)
                {
                    // Skip headers that are controlled by the server or related to encoding
                    if (!string.Equals(header.Key, "Content-Length", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(header.Key, "Transfer-Encoding", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(header.Key, "Connection", StringComparison.OrdinalIgnoreCase))
                    {
                        context.Response.Headers[header.Key] = header.Value.ToArray();
                    }
                }

                // Copy content headers
                if (response.Content != null)
                {
                    foreach (var header in response.Content.Headers)
                    {
                        // Skip headers that are controlled by the server or related to encoding
                        if (!string.Equals(header.Key, "Content-Length", StringComparison.OrdinalIgnoreCase) &&
                            !string.Equals(header.Key, "Content-Encoding", StringComparison.OrdinalIgnoreCase))
                        {
                            context.Response.Headers[header.Key] = header.Value.ToArray();
                        }
                    }
                }

                // Copy the response body by streaming it directly
                if (response.Content != null)
                {
                    await response.Content.CopyToAsync(context.Response.Body);
                }

                // Restore the original position of the request body
                context.Request.Body.Position = originalBodyPosition;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing forwarded request");
                
                context.Response.StatusCode = 502; // Bad Gateway
                context.Response.ContentType = "application/json";
                
                var errorJson = $"{{\"error\": \"Error forwarding request\", \"message\": \"{ex.Message}\"}}";
                await context.Response.WriteAsync(errorJson);
            }
        }

    }

    public static class ApiGatewayMiddlewareExtensions
    {
        public static IApplicationBuilder UseApiGateway(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ApiGatewayMiddleware>();
        }
    }
}
