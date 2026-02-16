using System.Text.Json;
using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using Microsoft.EntityFrameworkCore;

namespace crm_backend.Services.CustomerData;

public class MstLeadAssignmentService : ServiceBase, ILeadAssignmentService
{
    private readonly IUnitOfWork _unitOfWork;

    public MstLeadAssignmentService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        ILogger<MstLeadAssignmentService> logger)
        : base(tenantContextProvider, logger)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<LeadAssignmentResultDto?> AssignLeadAsync(MstLead lead)
    {
        var rules = await _unitOfWork.LeadAssignmentRules.GetActiveRulesOrderedAsync();
        if (!rules.Any()) return null;

        foreach (var rule in rules)
        {
            var members = rule.Members.Where(m => m.bolIsActive).ToList();
            if (!members.Any()) continue;

            Guid? assignee = rule.strAssignmentType switch
            {
                AssignmentTypeConstants.RoundRobin => await GetRoundRobinAssignee(rule, members),
                AssignmentTypeConstants.Territory => GetTerritoryAssignee(rule, lead, members),
                AssignmentTypeConstants.Capacity => await GetCapacityAssignee(members),
                AssignmentTypeConstants.SkillBased => GetSkillBasedAssignee(lead, members),
                _ => null
            };

            if (assignee.HasValue)
            {
                return new LeadAssignmentResultDto
                {
                    strLeadGUID = lead.strLeadGUID,
                    strAssignedToGUID = assignee.Value,
                    strAssignmentMethod = rule.strAssignmentType,
                    strRuleName = rule.strRuleName
                };
            }
        }

        return null;
    }

    private async Task<Guid?> GetRoundRobinAssignee(MstLeadAssignmentRule rule, List<MstLeadAssignmentMember> members)
    {
        var nextIndex = (rule.intLastAssignedIndex + 1) % members.Count;
        rule.intLastAssignedIndex = nextIndex;
        _unitOfWork.LeadAssignmentRules.Update(rule);
        await _unitOfWork.SaveChangesAsync();
        return members[nextIndex].strUserGUID;
    }

    private Guid? GetTerritoryAssignee(MstLeadAssignmentRule rule, MstLead lead, List<MstLeadAssignmentMember> members)
    {
        if (string.IsNullOrWhiteSpace(rule.strConditionJson)) return members.First().strUserGUID;

        try
        {
            var conditions = JsonSerializer.Deserialize<Dictionary<string, string>>(rule.strConditionJson);
            if (conditions == null) return null;

            bool matches = true;
            if (conditions.TryGetValue("city", out var city) && !string.IsNullOrWhiteSpace(city))
                matches &= lead.strCity?.Equals(city, StringComparison.OrdinalIgnoreCase) ?? false;
            if (conditions.TryGetValue("state", out var state) && !string.IsNullOrWhiteSpace(state))
                matches &= lead.strState?.Equals(state, StringComparison.OrdinalIgnoreCase) ?? false;
            if (conditions.TryGetValue("country", out var country) && !string.IsNullOrWhiteSpace(country))
                matches &= lead.strCountry?.Equals(country, StringComparison.OrdinalIgnoreCase) ?? false;

            return matches ? members.First().strUserGUID : null;
        }
        catch { return null; }
    }

    private async Task<Guid?> GetCapacityAssignee(List<MstLeadAssignmentMember> members)
    {
        Guid? bestMember = null;
        int lowestCount = int.MaxValue;

        foreach (var member in members)
        {
            var count = await _unitOfWork.Leads.Query()
                .CountAsync(l => l.strAssignedToGUID == member.strUserGUID && l.bolIsActive &&
                    LeadStatusConstants.ActiveStatuses.Contains(l.strStatus));

            if (member.intMaxCapacity.HasValue && count >= member.intMaxCapacity.Value) continue;

            if (count < lowestCount)
            {
                lowestCount = count;
                bestMember = member.strUserGUID;
            }
        }

        return bestMember;
    }

    private Guid? GetSkillBasedAssignee(MstLead lead, List<MstLeadAssignmentMember> members)
    {
        var targetSkill = lead.intLeadScore >= 70 ? "Senior" :
                          lead.intLeadScore >= 40 ? "Senior" : "Junior";

        var match = members.FirstOrDefault(m => m.strSkillLevel == targetSkill) ?? members.FirstOrDefault();
        return match?.strUserGUID;
    }
}
