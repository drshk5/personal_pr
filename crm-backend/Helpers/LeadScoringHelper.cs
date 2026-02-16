using crm_backend.Constants;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Helpers;

public static class LeadScoringHelper
{
    public static int CalculateScore(MstLead lead)
    {
        int score = 0;

        // +10 = Has email
        if (!string.IsNullOrWhiteSpace(lead.strEmail))
            score += 10;

        // +10 = Has phone
        if (!string.IsNullOrWhiteSpace(lead.strPhone))
            score += 10;

        // +15 = Has company name
        if (!string.IsNullOrWhiteSpace(lead.strCompanyName))
            score += 15;

        // +10 = Has job title
        if (!string.IsNullOrWhiteSpace(lead.strJobTitle))
            score += 10;

        // +5 = Source is Referral
        if (lead.strSource == LeadSourceConstants.Referral)
            score += 5;

        // +3 = Source is Website
        if (lead.strSource == LeadSourceConstants.Website)
            score += 3;

        // +20 = Status is Qualified
        if (lead.strStatus == LeadStatusConstants.Qualified)
            score += 20;

        // +10 = Status is Contacted
        if (lead.strStatus == LeadStatusConstants.Contacted)
            score += 10;

        // Cap at 100
        return Math.Min(score, 100);
    }

    public static int RecalculateWithActivity(int currentScore, bool hasRecentActivity)
    {
        int score = currentScore;

        // +5 = Has recent activity (last 7 days)
        if (hasRecentActivity)
            score += 5;

        return Math.Min(score, 100);
    }
}
