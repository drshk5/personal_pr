namespace crm_backend.Models.Wrappers;

public class BaseResponse
{
    public int statusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsSuccess => statusCode >= 200 && statusCode < 300;
}
