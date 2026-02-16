using AuditSoftware.Services;
using AuditSoftware.Interfaces;
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
using Moq.Protected;

namespace AuditSoftware.Tests.Services
{
    public class ApiGatewayServiceTests
    {
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<ILogger<ApiGatewayService>> _mockLogger;
        private readonly Mock<IAuthService> _mockAuthService;
        private readonly ApiGatewayService _service;
        private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;

        public ApiGatewayServiceTests()
        {
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockLogger = new Mock<ILogger<ApiGatewayService>>();
            _mockAuthService = new Mock<IAuthService>();
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>();

            // Setup auth service mock to handle token decryption
            _mockAuthService
                .Setup(auth => auth.DecryptToken(It.IsAny<string>()))
                .Returns<string>(token => "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"); // Return a valid JWT token

            var httpClient = new HttpClient(_mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://localhost/")
            };

            _mockHttpClientFactory
                .Setup(factory => factory.CreateClient(It.IsAny<string>()))
                .Returns(httpClient);

            _service = new ApiGatewayService(
                _mockHttpClientFactory.Object,
                _mockLogger.Object,
                _mockAuthService.Object);
        }

        [Fact]
        public async Task ForwardRequestAsync_WithGetRequest_ShouldForwardCorrectly()
        {
            // Arrange
            var context = new DefaultHttpContext();
            context.Request.Method = "GET";
            context.Request.Path = "/api/task/items";
            context.Request.QueryString = new QueryString("?param1=value1&param2=value2");
            context.Request.Headers["Authorization"] = "Bearer test-access-token";
            context.Request.Headers["X-Refresh-Token"] = "test-refresh-token";
            context.Request.Headers["User-Agent"] = "Test-Agent";
            
            // Set up mock HTTP handler
            var responseMessage = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{ \"result\": \"success\" }", Encoding.UTF8, "application/json")
            };

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => 
                        req.Method == HttpMethod.Get &&
                        req.RequestUri != null &&
                        req.RequestUri.ToString().Contains("/api/task/items") &&
                        req.RequestUri.Query.Contains("param1=value1") &&
                        req.Headers.Contains("Authorization")
                    ),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(responseMessage);

            // Act
            var result = await _service.ForwardRequestAsync(context, "https://localhost:5002", "/api/task/items");

            // Assert
            Assert.Equal(HttpStatusCode.OK, result.StatusCode);
            var content = await result.Content.ReadAsStringAsync();
            Assert.Contains("success", content);
        }

        [Fact]
        public async Task ForwardRequestAsync_WithPostRequest_ShouldForwardBodyCorrectly()
        {
            // Arrange
            var context = new DefaultHttpContext();
            context.Request.Method = "POST";
            context.Request.Path = "/api/task/items";
            context.Request.ContentType = "application/json";
            
            var requestBody = Encoding.UTF8.GetBytes("{ \"name\": \"test\" }");
            context.Request.Body = new MemoryStream(requestBody);
            context.Request.ContentLength = requestBody.Length;
            context.Request.EnableBuffering();

            // Set up mock HTTP handler
            var responseMessage = new HttpResponseMessage(HttpStatusCode.Created)
            {
                Content = new StringContent("{ \"id\": 1, \"name\": \"test\" }", Encoding.UTF8, "application/json")
            };

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => 
                        req.Method == HttpMethod.Post &&
                        req.RequestUri != null &&
                        req.RequestUri.ToString().Contains("/api/task/items")
                    ),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(responseMessage);

            // Act
            var result = await _service.ForwardRequestAsync(context, "https://localhost:5002", "/api/task/items");

            // Assert
            Assert.Equal(HttpStatusCode.Created, result.StatusCode);
            var content = await result.Content.ReadAsStringAsync();
            Assert.Contains("\"id\": 1", content);
            
            // Ensure the original request body position is reset
            Assert.Equal(0, context.Request.Body.Position);
        }

        [Fact]
        public async Task ForwardRequestAsync_WithCookieToken_ShouldDecryptAndForward()
        {
            // Arrange
            var context = new DefaultHttpContext();
            context.Request.Method = "GET";
            context.Request.Path = "/api/task/items";
            // Add cookie using the IRequestCookieCollection accessor method
            context.Request.Headers.Append("Cookie", "Token=encrypted-token");

            var responseMessage = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{ \"result\": \"success\" }", Encoding.UTF8, "application/json")
            };

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => 
                        req.Headers.Contains("Authorization") &&
                        req.Headers.GetValues("Authorization").First() == "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                    ),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(responseMessage);

            // Act
            var result = await _service.ForwardRequestAsync(context, "https://localhost:5002", "/api/task/items");

            // Assert
            Assert.Equal(HttpStatusCode.OK, result.StatusCode);
            
            // Verify the token was decrypted and forwarded correctly
            _mockHttpMessageHandler.Protected()
                .Verify(
                    "SendAsync",
                    Times.Once(),
                    ItExpr.Is<HttpRequestMessage>(req =>
                        req.Headers.Contains("Authorization") &&
                        req.Headers.Contains("X-Forwarded-Auth")),
                    ItExpr.IsAny<CancellationToken>()
                );
            
            _mockAuthService.Verify(
                auth => auth.DecryptToken("encrypted-token"),
                Times.Once()
            );
        }

        [Fact]
        public async Task ForwardRequestAsync_WithHttpError_ShouldPropagateError()
        {
            // Arrange
            var context = new DefaultHttpContext();
            context.Request.Method = "GET";
            context.Request.Path = "/api/task/items";
            
            // Set up mock HTTP handler to throw an exception
            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ThrowsAsync(new HttpRequestException("Connection error"));

            // Act & Assert
            await Assert.ThrowsAsync<HttpRequestException>(() => 
                _service.ForwardRequestAsync(context, "https://localhost:5002", "/api/task/items")
            );
        }
    }
}
