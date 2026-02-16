namespace crm_backend.Exceptions;

public class NotFoundException : Exception
{
    public string ErrorCode { get; }

    public NotFoundException(string message) : base(message)
    {
        ErrorCode = "NOT_FOUND";
    }

    public NotFoundException(string message, string errorCode) : base(message)
    {
        ErrorCode = errorCode;
    }
}
