using System.Text.Json.Serialization;

namespace AuditSoftware.DTOs.Common
{
    public class ApiResponse<T>
    {
        [JsonPropertyName("statusCode")]
        public int statusCode { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("errorCode")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ErrorCode { get; set; }

        [JsonPropertyName("data")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public T? Data { get; set; }

        public static ApiResponse<T> Success(T data, string message = "Success")
        {
            return new ApiResponse<T>
            {
                statusCode = 200,
                Message = message,
                Data = data
            };
        }

        public static ApiResponse<T> Fail(int statusCode, string message)
        {
            return new ApiResponse<T>
            {
                statusCode = statusCode,
                Message = message
            };
        }
        
        public static ApiResponse<T> Fail(int statusCode, string message, string errorCode)
        {
            return new ApiResponse<T>
            {
                statusCode = statusCode,
                Message = message,
                ErrorCode = errorCode
            };
        }
    }
} 