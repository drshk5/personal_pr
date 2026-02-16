using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.DTOs.Common;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.CustomerData;

public class MstLeadScoringApplicationService : ApplicationServiceBase, IMstLeadScoringApplicationService
{
    private readonly ILeadScoringService _scoringService;
    private readonly IAuditLogService _auditLogService;

    public MstLeadScoringApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        ILeadScoringService scoringService,
        IAuditLogService auditLogService,
        ILogger<MstLeadScoringApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _scoringService = scoringService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResponse<ScoringRuleListDto>> GetRulesAsync(ScoringRuleFilterParams filter)
    {
        var query = _unitOfWork.LeadScoringRules.Query();

        if (!string.IsNullOrWhiteSpace(filter.strRuleCategory))
            query = query.Where(r => r.strRuleCategory == filter.strRuleCategory);
        if (filter.bolIsActive.HasValue)
            query = query.Where(r => r.bolIsActive == filter.bolIsActive.Value);
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(r => r.strRuleName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();
        // Tenant legacy schema does not persist intSortOrder, so sort by stable persisted fields.
        var items = await query
            .OrderByDescending(r => r.dtCreatedOn)
            .ThenBy(r => r.strRuleName)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResponse<ScoringRuleListDto>
        {
            Items = items.Select(MapToListDto).ToList(),
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<ScoringRuleListDto> GetRuleByIdAsync(Guid id)
    {
        var rule = await _unitOfWork.LeadScoringRules.GetByIdAsync(id);
        if (rule == null) throw new NotFoundException("Scoring rule not found", "SCORING_RULE_NOT_FOUND");
        return MapToListDto(rule);
    }

    public async Task<ScoringRuleListDto> CreateRuleAsync(CreateScoringRuleDto dto)
    {
        var rule = new MstLeadScoringRule
        {
            strScoringRuleGUID = Guid.NewGuid(),
            strGroupGUID = GetTenantId(),
            strRuleName = dto.strRuleName,
            strRuleCategory = dto.strRuleCategory,
            strConditionField = dto.strConditionField,
            strConditionOperator = dto.strConditionOperator,
            strConditionValue = dto.strConditionValue,
            intScorePoints = dto.intScorePoints,
            intDecayDays = dto.intDecayDays,
            intSortOrder = dto.intSortOrder,
            strCreatedByGUID = GetCurrentUserId(),
            dtCreatedOn = DateTime.UtcNow,
            bolIsActive = true
        };

        await _unitOfWork.LeadScoringRules.AddAsync(rule);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(EntityTypeConstants.ScoringRule, rule.strScoringRuleGUID, "Create",
            JsonSerializer.Serialize(new { dto.strRuleName, dto.strRuleCategory, dto.intScorePoints }), GetCurrentUserId());

        return MapToListDto(rule);
    }

    public async Task<ScoringRuleListDto> UpdateRuleAsync(Guid id, UpdateScoringRuleDto dto)
    {
        var rule = await _unitOfWork.LeadScoringRules.GetByIdAsync(id);
        if (rule == null) throw new NotFoundException("Scoring rule not found", "SCORING_RULE_NOT_FOUND");

        rule.strRuleName = dto.strRuleName;
        rule.strRuleCategory = dto.strRuleCategory;
        rule.strConditionField = dto.strConditionField;
        rule.strConditionOperator = dto.strConditionOperator;
        rule.strConditionValue = dto.strConditionValue;
        rule.intScorePoints = dto.intScorePoints;
        rule.intDecayDays = dto.intDecayDays;
        rule.intSortOrder = dto.intSortOrder;
        rule.bolIsActive = dto.bolIsActive;
        rule.strUpdatedByGUID = GetCurrentUserId();
        rule.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.LeadScoringRules.Update(rule);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(EntityTypeConstants.ScoringRule, rule.strScoringRuleGUID, "Update", null, GetCurrentUserId());

        return MapToListDto(rule);
    }

    public async Task<bool> DeleteRuleAsync(Guid id)
    {
        var rule = await _unitOfWork.LeadScoringRules.GetByIdAsync(id);
        if (rule == null) throw new NotFoundException("Scoring rule not found", "SCORING_RULE_NOT_FOUND");

        rule.bolIsDeleted = true;
        rule.bolIsActive = false;
        rule.strUpdatedByGUID = GetCurrentUserId();
        rule.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.LeadScoringRules.Update(rule);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(EntityTypeConstants.ScoringRule, rule.strScoringRuleGUID, "Delete", null, GetCurrentUserId());
        return true;
    }

    public async Task<PagedResponse<ScoreHistoryListDto>> GetScoreHistoryAsync(Guid leadId, PagedRequestDto paging)
    {
        var query = _unitOfWork.LeadScoreHistory.Query().Where(h => h.strLeadGUID == leadId);
        var totalCount = await query.CountAsync();
        var items = await query.OrderByDescending(h => h.dtCreatedOn)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .ToListAsync();

        return new PagedResponse<ScoreHistoryListDto>
        {
            Items = items.Select(h => new ScoreHistoryListDto
            {
                strScoreHistoryGUID = h.strScoreHistoryGUID,
                strLeadGUID = h.strLeadGUID,
                intPreviousScore = h.intPreviousScore,
                intNewScore = h.intNewScore,
                intScoreChange = h.intScoreChange,
                strChangeReason = h.strChangeReason,
                strScoringRuleGUID = h.strScoringRuleGUID,
                dtCreatedOn = h.dtCreatedOn
            }).ToList(),
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)paging.PageSize)
        };
    }

    public async Task<ScoreBreakdownDto> GetScoreBreakdownAsync(Guid leadId)
    {
        var lead = await _unitOfWork.Leads.GetByIdAsync(leadId);
        if (lead == null) throw new NotFoundException("Lead not found", LeadErrorCodes.LeadNotFound);
        return await _scoringService.GetScoreBreakdownAsync(lead);
    }

    public async Task RecalculateAllScoresAsync()
    {
        await _scoringService.RecalculateAllScoresAsync();
    }

    private static ScoringRuleListDto MapToListDto(MstLeadScoringRule rule) => new()
    {
        strScoringRuleGUID = rule.strScoringRuleGUID,
        strRuleName = rule.strRuleName,
        strRuleCategory = rule.strRuleCategory,
        strConditionField = rule.strConditionField,
        strConditionOperator = rule.strConditionOperator,
        strConditionValue = rule.strConditionValue,
        intScorePoints = rule.intScorePoints,
        intDecayDays = rule.intDecayDays,
        intSortOrder = rule.intSortOrder,
        bolIsActive = rule.bolIsActive,
        dtCreatedOn = rule.dtCreatedOn
    };
}
