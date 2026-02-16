using System.Text.Json;
using crm_backend.Exceptions;
using crm_backend.Models.Wrappers;

namespace crm_backend.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception error)
        {
            var response = context.Response;
            response.ContentType = "application/json";

            ApiResponse<object> errorResponse;

            switch (error)
            {
                case BusinessException e:
                    response.StatusCode = 400;
                    errorResponse = ApiResponse<object>.Fail(400, e.Message, e.ErrorCode);
                    _logger.LogWarning("Business error: {Message} [{ErrorCode}]", e.Message, e.ErrorCode);
                    break;

                case Exceptions.ValidationException e:
                    response.StatusCode = 422;
                    errorResponse = ApiResponse<object>.Fail(422, e.Message);
                    _logger.LogWarning("Validation error: {Message}", e.Message);
                    break;

                case NotFoundException e:
                    response.StatusCode = 404;
                    errorResponse = ApiResponse<object>.Fail(404, e.Message, e.ErrorCode);
                    break;

                case UnauthorizedAccessException e:
                    response.StatusCode = 401;
                    errorResponse = ApiResponse<object>.Fail(401, e.Message);
                    break;

                default:
                    response.StatusCode = 500;
                    errorResponse = ApiResponse<object>.Fail(500, "An internal server error occurred");
                    _logger.LogError(error, "Unhandled exception: {Message}", error.Message);
                    break;
            }

            var result = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = null,
                WriteIndented = false
            });
            await response.WriteAsync(result);
        }
    }
}
