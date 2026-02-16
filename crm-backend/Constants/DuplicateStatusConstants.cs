namespace crm_backend.Constants;

public static class DuplicateStatusConstants
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Dismissed = "Dismissed";
    public const string Merged = "Merged";

    public static readonly string[] AllStatuses = { Pending, Confirmed, Dismissed, Merged };
}
