namespace crm_backend.Constants;

public static class OpportunityContactMapping
{
    public const string DecisionMaker = "DecisionMaker";
    public const string Influencer = "Influencer";
    public const string Champion = "Champion";
    public const string Stakeholder = "Stakeholder";
    public const string EndUser = "EndUser";

    public static readonly string[] AllRoles = { DecisionMaker, Influencer, Champion, Stakeholder, EndUser };
}
