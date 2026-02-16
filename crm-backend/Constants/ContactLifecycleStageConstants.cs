namespace crm_backend.Constants;

public static class ContactLifecycleStageConstants
{
    public const string Subscriber = "Subscriber";
    public const string Lead = "Lead";
    public const string MQL = "MQL";
    public const string SQL = "SQL";
    public const string Opportunity = "Opportunity";
    public const string Customer = "Customer";
    public const string Evangelist = "Evangelist";

    public static readonly string[] AllStages = { Subscriber, Lead, MQL, SQL, Opportunity, Customer, Evangelist };
}
