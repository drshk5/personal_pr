namespace crm_backend.Constants;

public static class ImportStatusConstants
{
    public const string Pending = "Pending";
    public const string Processing = "Processing";
    public const string Completed = "Completed";
    public const string Failed = "Failed";

    public static readonly string[] AllStatuses = { Pending, Processing, Completed, Failed };
}
