namespace crm_backend.Exceptions;

public class BusinessException : Exception
{
    public string ErrorCode { get; }

    public BusinessException(string message) : base(message)
    {
        ErrorCode = "BUSINESS_ERROR";
    }

    public BusinessException(string message, string errorCode) : base(message)
    {
        ErrorCode = errorCode;
    }
}
