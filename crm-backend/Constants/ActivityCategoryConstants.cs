namespace crm_backend.Constants;

public static class ActivityCategoryConstants
{
    public const string Sales = "Sales";
    public const string Support = "Support";
    public const string FollowUp = "FollowUp";
    public const string Internal = "Internal";
    public const string Marketing = "Marketing";

    public static readonly string[] AllCategories = { Sales, Support, FollowUp, Internal, Marketing };
}
