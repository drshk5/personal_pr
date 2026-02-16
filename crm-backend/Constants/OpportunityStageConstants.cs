namespace crm_backend.Constants;

public static class OpportunityStageConstants
{
    public const string Prospecting = "Prospecting";
    public const string Qualification = "Qualification";
    public const string Proposal = "Proposal";
    public const string Negotiation = "Negotiation";
    public const string ClosedWon = "Closed Won";
    public const string ClosedLost = "Closed Lost";

    public static readonly Dictionary<string, int> DefaultProbabilities = new()
    {
        { Prospecting, 10 }, { Qualification, 25 }, { Proposal, 50 },
        { Negotiation, 75 }, { ClosedWon, 100 }, { ClosedLost, 0 }
    };

    public static readonly Dictionary<string, int> DefaultDaysToRot = new()
    {
        { Prospecting, 14 }, { Qualification, 21 }, { Proposal, 30 },
        { Negotiation, 14 }, { ClosedWon, 0 }, { ClosedLost, 0 }
    };
}
