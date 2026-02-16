using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.CustomerData;

public class MstLeadAssignmentApplicationService : ApplicationServiceBase, IMstLeadAssignmentApplicationService
{
    private readonly ILeadAssignmentService _assignmentService;
    private readonly IAuditLogService _auditLogService;

    public MstLeadAssignmentApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        ILeadAssignmentService assignmentService,
        IAuditLogService auditLogService,
        ILogger<MstLeadAssignmentApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _assignmentService = assignmentService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResponse<AssignmentRuleListDto>> GetRulesAsync(AssignmentRuleFilterParams filter)
    {
        var query = _unitOfWork.LeadAssignmentRules.Query();
        if (!string.IsNullOrWhiteSpace(filter.strAssignmentType))
            query = query.Where(r => r.strAssignmentType == filter.strAssignmentType);
        if (filter.bolIsActive.HasValue)
            query = query.Where(r => r.bolIsActive == filter.bolIsActive.Value);

        var totalCount = await query.CountAsync();
        var items = await query.OrderBy(r => r.intPriority)
            .Skip((filter.PageNumber - 1) * filter.PageSize).Take(filter.PageSize)
            .Include(r => r.Members)
            .ToListAsync();

        return new PagedResponse<AssignmentRuleListDto>
        {
            Items = items.Select(r => new AssignmentRuleListDto
            {
                strAssignmentRuleGUID = r.strAssignmentRuleGUID,
                strRuleName = r.strRuleName,
                strAssignmentType = r.strAssignmentType,
                strConditionJson = r.strConditionJson,
                intPriority = r.intPriority,
                bolIsActive = r.bolIsActive,
                intMemberCount = r.Members.Count(m => m.bolIsActive),
                dtCreatedOn = r.dtCreatedOn
            }).ToList(),
            TotalCount = totalCount, PageNumber = filter.PageNumber, PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<AssignmentRuleListDto> CreateRuleAsync(CreateAssignmentRuleDto dto)
    {
        var rule = new MstLeadAssignmentRule
        {
            strAssignmentRuleGUID = Guid.NewGuid(),
            strGroupGUID = GetTenantId(),
            strRuleName = dto.strRuleName,
            strAssignmentType = dto.strAssignmentType,
            strConditionJson = dto.strConditionJson,
            intPriority = dto.intPriority,
            strCreatedByGUID = GetCurrentUserId(),
            dtCreatedOn = DateTime.UtcNow,
            bolIsActive = true
        };
        await _unitOfWork.LeadAssignmentRules.AddAsync(rule);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogService.LogAsync(EntityTypeConstants.AssignmentRule, rule.strAssignmentRuleGUID, "Create", null, GetCurrentUserId());

        return new AssignmentRuleListDto
        {
            strAssignmentRuleGUID = rule.strAssignmentRuleGUID, strRuleName = rule.strRuleName,
            strAssignmentType = rule.strAssignmentType, strConditionJson = rule.strConditionJson,
            intPriority = rule.intPriority, bolIsActive = rule.bolIsActive, intMemberCount = 0, dtCreatedOn = rule.dtCreatedOn
        };
    }

    public async Task<AssignmentRuleListDto> UpdateRuleAsync(Guid id, UpdateAssignmentRuleDto dto)
    {
        var rule = await _unitOfWork.LeadAssignmentRules.GetByIdAsync(id);
        if (rule == null) throw new NotFoundException("Assignment rule not found", "ASSIGNMENT_RULE_NOT_FOUND");

        rule.strRuleName = dto.strRuleName; rule.strAssignmentType = dto.strAssignmentType;
        rule.strConditionJson = dto.strConditionJson; rule.intPriority = dto.intPriority;
        rule.bolIsActive = dto.bolIsActive; rule.strUpdatedByGUID = GetCurrentUserId(); rule.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.LeadAssignmentRules.Update(rule);
        await _unitOfWork.SaveChangesAsync();
        return new AssignmentRuleListDto
        {
            strAssignmentRuleGUID = rule.strAssignmentRuleGUID, strRuleName = rule.strRuleName,
            strAssignmentType = rule.strAssignmentType, strConditionJson = rule.strConditionJson,
            intPriority = rule.intPriority, bolIsActive = rule.bolIsActive, dtCreatedOn = rule.dtCreatedOn
        };
    }

    public async Task<bool> DeleteRuleAsync(Guid id)
    {
        var rule = await _unitOfWork.LeadAssignmentRules.GetByIdAsync(id);
        if (rule == null) throw new NotFoundException("Assignment rule not found", "ASSIGNMENT_RULE_NOT_FOUND");
        rule.bolIsDeleted = true; rule.bolIsActive = false; rule.strUpdatedByGUID = GetCurrentUserId(); rule.dtUpdatedOn = DateTime.UtcNow;
        _unitOfWork.LeadAssignmentRules.Update(rule);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<List<AssignmentMemberDto>> GetMembersAsync(Guid ruleId)
    {
        var members = await _unitOfWork.LeadAssignmentMembers.GetByRuleIdAsync(ruleId);
        return members.Select(m => new AssignmentMemberDto
        {
            strAssignmentMemberGUID = m.strAssignmentMemberGUID, strUserGUID = m.strUserGUID,
            intMaxCapacity = m.intMaxCapacity, strSkillLevel = m.strSkillLevel, bolIsActive = m.bolIsActive
        }).ToList();
    }

    public async Task<AssignmentMemberDto> AddMemberAsync(Guid ruleId, AddAssignmentMemberDto dto)
    {
        var member = new MstLeadAssignmentMember
        {
            strAssignmentMemberGUID = Guid.NewGuid(), strGroupGUID = GetTenantId(),
            strAssignmentRuleGUID = ruleId, strUserGUID = dto.strUserGUID,
            intMaxCapacity = dto.intMaxCapacity, strSkillLevel = dto.strSkillLevel,
            bolIsActive = true, dtCreatedOn = DateTime.UtcNow
        };
        await _unitOfWork.LeadAssignmentMembers.AddAsync(member);
        await _unitOfWork.SaveChangesAsync();
        return new AssignmentMemberDto
        {
            strAssignmentMemberGUID = member.strAssignmentMemberGUID, strUserGUID = member.strUserGUID,
            intMaxCapacity = member.intMaxCapacity, strSkillLevel = member.strSkillLevel, bolIsActive = true
        };
    }

    public async Task<bool> RemoveMemberAsync(Guid ruleId, Guid memberId)
    {
        var member = await _unitOfWork.LeadAssignmentMembers.GetByIdAsync(memberId);
        if (member == null || member.strAssignmentRuleGUID != ruleId) throw new NotFoundException("Member not found", "MEMBER_NOT_FOUND");
        member.bolIsActive = false;
        _unitOfWork.LeadAssignmentMembers.Update(member);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<LeadAssignmentResultDto?> AutoAssignLeadAsync(Guid leadId)
    {
        var lead = await _unitOfWork.Leads.GetByIdAsync(leadId);
        if (lead == null) throw new NotFoundException("Lead not found", LeadErrorCodes.LeadNotFound);
        var result = await _assignmentService.AssignLeadAsync(lead);
        if (result != null)
        {
            lead.strAssignedToGUID = result.strAssignedToGUID;
            lead.strUpdatedByGUID = GetCurrentUserId(); lead.dtUpdatedOn = DateTime.UtcNow;
            _unitOfWork.Leads.Update(lead);
            await _unitOfWork.SaveChangesAsync();
        }
        return result;
    }

    public async Task<LeadAssignmentResultDto> ManualAssignAsync(ManualAssignDto dto)
    {
        var lead = await _unitOfWork.Leads.GetByIdAsync(dto.strLeadGUID);
        if (lead == null) throw new NotFoundException("Lead not found", LeadErrorCodes.LeadNotFound);
        lead.strAssignedToGUID = dto.strAssignToGUID;
        lead.strUpdatedByGUID = GetCurrentUserId(); lead.dtUpdatedOn = DateTime.UtcNow;
        _unitOfWork.Leads.Update(lead);
        await _unitOfWork.SaveChangesAsync();
        return new LeadAssignmentResultDto
        {
            strLeadGUID = lead.strLeadGUID, strAssignedToGUID = dto.strAssignToGUID, strAssignmentMethod = "Manual"
        };
    }
}
