namespace crm_backend.Constants;

public static class ActivityStatusConstants
{
    public const string Pending = "Pending";
    public const string InProgress = "InProgress";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    public static readonly string[] AllStatuses = { Pending, InProgress, Completed, Cancelled };
    public static readonly string[] ActiveStatuses = { Pending, InProgress };
}
