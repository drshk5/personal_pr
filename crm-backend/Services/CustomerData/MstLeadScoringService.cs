using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Helpers;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using Microsoft.EntityFrameworkCore;

namespace crm_backend.Services.CustomerData;

public class MstLeadScoringService : ServiceBase, ILeadScoringService
{
    private readonly IUnitOfWork _unitOfWork;

    public MstLeadScoringService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        ILogger<MstLeadScoringService> logger)
        : base(tenantContextProvider, logger)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<int> CalculateScoreAsync(MstLead lead)
    {
        var rules = await _unitOfWork.LeadScoringRules.GetAllActiveRulesAsync();

        if (!rules.Any())
            return LeadScoringHelper.CalculateScore(lead);

        int score = 0;
        foreach (var rule in rules)
        {
            if (EvaluateRule(rule, lead))
                score += rule.intScorePoints;
        }

        return Math.Clamp(score, 0, 100);
    }

    public async Task<ScoreBreakdownDto> GetScoreBreakdownAsync(MstLead lead)
    {
        var rules = await _unitOfWork.LeadScoringRules.GetAllActiveRulesAsync();
        var breakdown = new ScoreBreakdownDto
        {
            strLeadGUID = lead.strLeadGUID,
            Items = new List<ScoreBreakdownItemDto>()
        };

        if (!rules.Any())
        {
            breakdown.intTotalScore = LeadScoringHelper.CalculateScore(lead);
            return breakdown;
        }

        int totalScore = 0;
        foreach (var rule in rules)
        {
            bool applied = EvaluateRule(rule, lead);
            int points = applied ? rule.intScorePoints : 0;
            totalScore += points;

            breakdown.Items.Add(new ScoreBreakdownItemDto
            {
                strRuleName = rule.strRuleName,
                strRuleCategory = rule.strRuleCategory,
                strConditionField = rule.strConditionField,
                intPoints = points,
                bolApplied = applied
            });
        }

        breakdown.intTotalScore = Math.Clamp(totalScore, 0, 100);
        return breakdown;
    }

    public async Task RecordScoreChangeAsync(Guid leadGuid, int previousScore, int newScore, string reason, Guid? ruleGuid = null)
    {
        if (previousScore == newScore) return;

        var history = new MstLeadScoreHistory
        {
            strScoreHistoryGUID = Guid.NewGuid(),
            strGroupGUID = GetTenantId(),
            strLeadGUID = leadGuid,
            intPreviousScore = previousScore,
            intNewScore = newScore,
            intScoreChange = newScore - previousScore,
            strChangeReason = reason,
            strScoringRuleGUID = ruleGuid,
            dtCreatedOn = DateTime.UtcNow
        };

        await _unitOfWork.LeadScoreHistory.AddAsync(history);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ApplyDecayAsync()
    {
        var decayRules = await _unitOfWork.LeadScoringRules.GetActiveRulesByCategoryAsync(ScoringRuleCategoryConstants.Decay);
        if (!decayRules.Any()) return;

        var activeLeads = await _unitOfWork.Leads.Query()
            .Where(l => l.bolIsActive && l.strStatus != LeadStatusConstants.Converted)
            .ToListAsync();

        foreach (var lead in activeLeads)
        {
            var lastActivity = await _unitOfWork.Activities.Query()
                .Join(_unitOfWork.ActivityLinks.Query(),
                    a => a.strActivityGUID,
                    al => al.strActivityGUID,
                    (a, al) => new { Activity = a, Link = al })
                .Where(x => x.Link.strEntityType == EntityTypeConstants.Lead && x.Link.strEntityGUID == lead.strLeadGUID)
                .OrderByDescending(x => x.Activity.dtCreatedOn)
                .Select(x => x.Activity.dtCreatedOn)
                .FirstOrDefaultAsync();

            var daysSinceActivity = lastActivity == default
                ? (DateTime.UtcNow - lead.dtCreatedOn).Days
                : (DateTime.UtcNow - lastActivity).Days;

            foreach (var rule in decayRules)
            {
                if (rule.intDecayDays.HasValue && daysSinceActivity >= rule.intDecayDays.Value)
                {
                    var oldScore = lead.intLeadScore;
                    lead.intLeadScore = Math.Clamp(lead.intLeadScore + rule.intScorePoints, 0, 100);

                    if (oldScore != lead.intLeadScore)
                    {
                        _unitOfWork.Leads.Update(lead);
                        await RecordScoreChangeAsync(lead.strLeadGUID, oldScore, lead.intLeadScore,
                            $"Decay: {daysSinceActivity} days inactivity (rule: {rule.strRuleName})", rule.strScoringRuleGUID);
                    }
                }
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task RecalculateAllScoresAsync()
    {
        var leads = await _unitOfWork.Leads.Query()
            .Where(l => l.bolIsActive && l.strStatus != LeadStatusConstants.Converted)
            .ToListAsync();

        foreach (var lead in leads)
        {
            var oldScore = lead.intLeadScore;
            lead.intLeadScore = await CalculateScoreAsync(lead);

            if (oldScore != lead.intLeadScore)
            {
                _unitOfWork.Leads.Update(lead);
                await RecordScoreChangeAsync(lead.strLeadGUID, oldScore, lead.intLeadScore, "Bulk recalculation");
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }

    private bool EvaluateRule(MstLeadScoringRule rule, MstLead lead)
    {
        return rule.strConditionField switch
        {
            "HasEmail" => !string.IsNullOrWhiteSpace(lead.strEmail),
            "HasPhone" => !string.IsNullOrWhiteSpace(lead.strPhone),
            "HasCompanyName" => !string.IsNullOrWhiteSpace(lead.strCompanyName),
            "HasJobTitle" => !string.IsNullOrWhiteSpace(lead.strJobTitle),
            "SourceEquals" => lead.strSource == rule.strConditionValue,
            "StatusEquals" => lead.strStatus == rule.strConditionValue,
            "HasAddress" => !string.IsNullOrWhiteSpace(lead.strCity) || !string.IsNullOrWhiteSpace(lead.strCountry),
            "CompetitorDomain" => !string.IsNullOrWhiteSpace(rule.strConditionValue) && lead.strEmail.Contains(rule.strConditionValue, StringComparison.OrdinalIgnoreCase),
            "Unsubscribed" => false, // Checked via communication tracking
            "BouncedEmail" => false, // Checked via communication tracking
            _ => EvaluateGenericCondition(rule, lead)
        };
    }

    private bool EvaluateGenericCondition(MstLeadScoringRule rule, MstLead lead)
    {
        var fieldValue = GetFieldValue(lead, rule.strConditionField);
        if (fieldValue == null) return rule.strConditionOperator == "NotExists";

        return rule.strConditionOperator switch
        {
            "Equals" => fieldValue.Equals(rule.strConditionValue, StringComparison.OrdinalIgnoreCase),
            "Contains" => fieldValue.Contains(rule.strConditionValue ?? "", StringComparison.OrdinalIgnoreCase),
            "Exists" => !string.IsNullOrWhiteSpace(fieldValue),
            "NotExists" => string.IsNullOrWhiteSpace(fieldValue),
            _ => false
        };
    }

    private string? GetFieldValue(MstLead lead, string fieldName)
    {
        return fieldName switch
        {
            "strEmail" => lead.strEmail,
            "strPhone" => lead.strPhone,
            "strCompanyName" => lead.strCompanyName,
            "strJobTitle" => lead.strJobTitle,
            "strSource" => lead.strSource,
            "strStatus" => lead.strStatus,
            "strCity" => lead.strCity,
            "strState" => lead.strState,
            "strCountry" => lead.strCountry,
            _ => null
        };
    }
}
