using System.Net;
using System.Text.Json;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AuditSoftware.Middleware;

public class GlobalExceptionHandler
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
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
                    errorResponse = ApiResponse<object>.Fail(StatusCodes.Status400BadRequest, e.Message);
                    break;

                case UnauthorizedAccessException e:
                    errorResponse = ApiResponse<object>.Fail(StatusCodes.Status401Unauthorized, e.Message);
                    break;

                case KeyNotFoundException e:
                    errorResponse = ApiResponse<object>.Fail(StatusCodes.Status404NotFound, e.Message);
                    break;

                case DbUpdateException e:
                    var message = GetDbUpdateExceptionMessage(e);
                    errorResponse = ApiResponse<object>.Fail(StatusCodes.Status400BadRequest, message);
                    _logger.LogError(e, "Database update error: {Message}", message);
                    break;

                case InvalidOperationException e:
                    errorResponse = ApiResponse<object>.Fail(StatusCodes.Status400BadRequest, e.Message);
                    _logger.LogError(e, "Invalid operation error: {Message}", e.Message);
                    break;

                case ArgumentException e:
                    errorResponse = ApiResponse<object>.Fail(StatusCodes.Status400BadRequest, e.Message);
                    _logger.LogError(e, "Invalid argument error: {Message}", e.Message);
                    break;

                default:
                    _logger.LogError(error, "Unhandled error: {Message}", error.Message);
                    errorResponse = ApiResponse<object>.Fail(
                        StatusCodes.Status500InternalServerError,
                        $"Server Error: {error.Message}");
                    break;
            }

            response.StatusCode = errorResponse.statusCode;
            await response.WriteAsJsonAsync(errorResponse);
        }
    }

    private string GetDbUpdateExceptionMessage(DbUpdateException ex)
    {
        var innerException = ex.InnerException?.Message ?? ex.Message;
        
        // Handle unique constraint violations with more specific messages
        if (innerException.Contains("duplicate", StringComparison.OrdinalIgnoreCase) || 
            innerException.Contains("unique", StringComparison.OrdinalIgnoreCase) ||
            innerException.Contains("IX_mstGroup", StringComparison.OrdinalIgnoreCase))
        {
            if (innerException.Contains("PAN", StringComparison.OrdinalIgnoreCase) || 
                innerException.Contains("IX_mstGroup_PAN", StringComparison.OrdinalIgnoreCase))
            {
                return "A group with this PAN number already exists.";
            }
            if (innerException.Contains("TAN", StringComparison.OrdinalIgnoreCase) || 
                innerException.Contains("IX_mstGroup_TAN", StringComparison.OrdinalIgnoreCase))
            {
                return "A group with this TAN number already exists.";
            }
            if (innerException.Contains("CIN", StringComparison.OrdinalIgnoreCase) || 
                innerException.Contains("IX_mstGroup_CIN", StringComparison.OrdinalIgnoreCase))
            {
                return "A group with this CIN number already exists.";
            }
            if (innerException.Contains("LicenseNo", StringComparison.OrdinalIgnoreCase) || 
                innerException.Contains("IX_mstGroup_LicenseNo", StringComparison.OrdinalIgnoreCase))
            {
                return "A group with this License number already exists.";
            }
            if (innerException.Contains("Email", StringComparison.OrdinalIgnoreCase) || 
                innerException.Contains("strEmailId", StringComparison.OrdinalIgnoreCase))
            {
                return "A user with this email address already exists.";
            }
            if (innerException.Contains("Mobile", StringComparison.OrdinalIgnoreCase) || 
                innerException.Contains("strMobileNo", StringComparison.OrdinalIgnoreCase))
            {
                return "A user with this mobile number already exists.";
            }
            return "A record with the same unique identifier already exists.";
        }

        // Handle foreign key violations
        if (innerException.Contains("foreign key", StringComparison.OrdinalIgnoreCase))
        {
            return "The operation failed because a related record does not exist.";
        }

        // Handle other database errors
        return $"Database error: Please check your input data for any conflicts or contact administrator.";
    }
} 
