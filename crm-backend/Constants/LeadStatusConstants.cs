namespace crm_backend.Constants;

public static class LeadStatusConstants
{
    public const string New = "New";
    public const string Contacted = "Contacted";
    public const string Qualified = "Qualified";
    public const string Unqualified = "Unqualified";
    public const string Converted = "Converted";

    public static readonly string[] AllStatuses = { New, Contacted, Qualified, Unqualified, Converted };
    public static readonly string[] ActiveStatuses = { New, Contacted, Qualified };
    public static readonly string[] ConvertibleStatuses = { Qualified };
}
