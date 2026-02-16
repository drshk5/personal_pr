namespace crm_backend.Constants;

public static class ScoringRuleCategoryConstants
{
    public const string Profile = "Profile";
    public const string Behavioral = "Behavioral";
    public const string Decay = "Decay";
    public const string Negative = "Negative";

    public static readonly string[] AllCategories = { Profile, Behavioral, Decay, Negative };
}
