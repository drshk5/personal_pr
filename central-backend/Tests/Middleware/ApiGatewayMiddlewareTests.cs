using AuditSoftware.Config;
using AuditSoftware.Middleware;
using AuditSoftware.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace AuditSoftware.Tests.Middleware
{
    public class ApiGatewayMiddlewareTests
    {
        private readonly Mock<IApiGatewayService> _mockApiGatewayService;
        private readonly Mock<ILogger<ApiGatewayMiddleware>> _mockLogger;
        private readonly Mock<IServiceProvider> _mockServiceProvider;
        private readonly ApiGatewayConfig _config;
        private readonly ApiGatewayMiddleware _middleware;
        private readonly RequestDelegate _nextDelegate;

        public ApiGatewayMiddlewareTests()
        {
            _mockApiGatewayService = new Mock<IApiGatewayService>();
            _mockLogger = new Mock<ILogger<ApiGatewayMiddleware>>();
            _mockServiceProvider = new Mock<IServiceProvider>();
            _config = new ApiGatewayConfig
            {
                TaskServiceBaseUrl = "https://localhost:5002",
                HrmServiceBaseUrl = "https://localhost:5003",
                AuditServiceBaseUrl = "https://localhost:5001"
            };

            _nextDelegate = (HttpContext context) => Task.CompletedTask;
            _middleware = new ApiGatewayMiddleware(_nextDelegate, _config, _mockServiceProvider.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task InvokeAsync_WithTaskEndpoint_ShouldForwardRequest()
        {
            // Arrange
            var context = new DefaultHttpContext();
            var serviceProvider = new Mock<IServiceProvider>();
            context.RequestServices = serviceProvider.Object;
            context.Request.Path = "/api/task/items";
            context.Request.Method = "GET";
            context.Response.Body = new MemoryStream();

            var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{ \"result\": \"success\" }", Encoding.UTF8, "application/json")
            };

            // Setup the service provider to return our mock service
            serviceProvider
                .Setup(sp => sp.GetService(typeof(IApiGatewayService)))
                .Returns(_mockApiGatewayService.Object);

            _mockApiGatewayService
                .Setup(s => s.ForwardRequestAsync(context, _config.TaskServiceBaseUrl, It.IsAny<string>()))
                .ReturnsAsync(mockResponse);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            _mockApiGatewayService.Verify(
                s => s.ForwardRequestAsync(context, _config.TaskServiceBaseUrl, "/api/task/items"), 
                Times.Once);
            
            Assert.Equal((int)HttpStatusCode.OK, context.Response.StatusCode);
        }

        [Fact]
        public async Task InvokeAsync_WithHrmEndpoint_ShouldForwardRequest()
        {
            // Arrange
            var context = new DefaultHttpContext();
            var serviceProvider = new Mock<IServiceProvider>();
            context.RequestServices = serviceProvider.Object;
            context.Request.Path = "/api/hrm/employees";
            context.Request.Method = "GET";
            context.Response.Body = new MemoryStream();

            var mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{ \"result\": \"success\" }", Encoding.UTF8, "application/json")
            };

            // Setup the service provider to return our mock service
            serviceProvider
                .Setup(sp => sp.GetService(typeof(IApiGatewayService)))
                .Returns(_mockApiGatewayService.Object);

            _mockApiGatewayService
                .Setup(s => s.ForwardRequestAsync(context, _config.HrmServiceBaseUrl, It.IsAny<string>()))
                .ReturnsAsync(mockResponse);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            _mockApiGatewayService.Verify(
                s => s.ForwardRequestAsync(context, _config.HrmServiceBaseUrl, "/api/hrm/employees"), 
                Times.Once);
            
            Assert.Equal((int)HttpStatusCode.OK, context.Response.StatusCode);
        }

        [Fact]
        public async Task InvokeAsync_WithOtherEndpoint_ShouldCallNext()
        {
            // Arrange
            var context = new DefaultHttpContext();
            context.Request.Path = "/api/other/endpoint";
            
            var nextCalled = false;
            RequestDelegate next = (HttpContext ctx) => {
                nextCalled = true;
                return Task.CompletedTask;
            };
            
            var serviceProvider = new Mock<IServiceProvider>();
            var middleware = new ApiGatewayMiddleware(next, _config, serviceProvider.Object, _mockLogger.Object);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.True(nextCalled);
            _mockApiGatewayService.Verify(
                s => s.ForwardRequestAsync(It.IsAny<HttpContext>(), It.IsAny<string>(), It.IsAny<string>()), 
                Times.Never);
        }

        [Fact]
        public async Task InvokeAsync_WithError_ShouldReturnBadGateway()
        {
            // Arrange
            var context = new DefaultHttpContext();
            var serviceProvider = new Mock<IServiceProvider>();
            context.RequestServices = serviceProvider.Object;
            context.Request.Path = "/api/task/items";
            context.Request.Method = "GET";
            context.Response.Body = new MemoryStream();

            // Setup the service provider to return our mock service
            serviceProvider
                .Setup(sp => sp.GetService(typeof(IApiGatewayService)))
                .Returns(_mockApiGatewayService.Object);

            _mockApiGatewayService
                .Setup(s => s.ForwardRequestAsync(context, _config.TaskServiceBaseUrl, It.IsAny<string>()))
                .ThrowsAsync(new Exception("Test Exception"));

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            Assert.Equal((int)HttpStatusCode.BadGateway, context.Response.StatusCode);
            Assert.Equal("application/json", context.Response.ContentType);

            // Reset the stream position to read the content
            context.Response.Body.Position = 0;
            using var reader = new StreamReader(context.Response.Body);
            var responseBody = await reader.ReadToEndAsync();
            
            Assert.Contains("Error forwarding request", responseBody);
            Assert.Contains("Test Exception", responseBody);
        }
    }
}
