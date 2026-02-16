namespace crm_backend.Constants;

public static class LeadSourceConstants
{
    public const string Website = "Website";
    public const string Referral = "Referral";
    public const string LinkedIn = "LinkedIn";
    public const string ColdCall = "ColdCall";
    public const string Advertisement = "Advertisement";
    public const string TradeShow = "TradeShow";
    public const string Other = "Other";

    public static readonly string[] AllSources = { Website, Referral, LinkedIn, ColdCall, Advertisement, TradeShow, Other };
}
