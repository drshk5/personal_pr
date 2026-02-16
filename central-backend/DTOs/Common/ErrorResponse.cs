namespace AuditSoftware.DTOs.Common;

public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;

    public static ErrorResponse Fail(int statusCode, string message)
    {
        return new ErrorResponse
        {
            StatusCode = statusCode,
            Message = message
        };
    }
} 