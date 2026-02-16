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

public class MstWorkflowApplicationService : ApplicationServiceBase, IMstWorkflowApplicationService
{
    private readonly IAuditLogService _auditLogService;

    public MstWorkflowApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        IAuditLogService auditLogService,
        ILogger<MstWorkflowApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _auditLogService = auditLogService;
    }

    public async Task<PagedResponse<WorkflowRuleListDto>> GetRulesAsync(WorkflowRuleFilterParams filter)
    {
        var query = _unitOfWork.WorkflowRules.Query()
            .Where(r => !r.bolIsDeleted);

        if (!string.IsNullOrWhiteSpace(filter.strEntityType))
            query = query.Where(r => r.strEntityType == filter.strEntityType);
        if (!string.IsNullOrWhiteSpace(filter.strTriggerEvent))
            query = query.Where(r => r.strTriggerEvent == filter.strTriggerEvent);
        if (filter.bolIsActive.HasValue)
            query = query.Where(r => r.bolIsActive == filter.bolIsActive.Value);
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(r => r.strRuleName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var pagedRules = await query
            .OrderByDescending(r => r.dtCreatedOn)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var ruleIds = pagedRules.Select(r => r.strWorkflowRuleGUID).ToList();
        var executionCounts = ruleIds.Count == 0
            ? new Dictionary<Guid, int>()
            : await _unitOfWork.WorkflowExecutions.Query()
                .Where(e => ruleIds.Contains(e.strWorkflowRuleGUID))
                .GroupBy(e => e.strWorkflowRuleGUID)
                .Select(g => new { RuleId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.RuleId, x => x.Count);

        var items = pagedRules
            .Select(rule => MapToListDto(rule, executionCounts.GetValueOrDefault(rule.strWorkflowRuleGUID, 0)))
            .ToList();

        return new PagedResponse<WorkflowRuleListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<WorkflowRuleListDto> GetRuleByIdAsync(Guid id)
    {
        var rule = await _unitOfWork.WorkflowRules.GetByIdAsync(id);
        if (rule == null || rule.bolIsDeleted)
            throw new NotFoundException("Workflow rule not found", "WORKFLOW_RULE_NOT_FOUND");

        var executionCount = await _unitOfWork.WorkflowExecutions.Query()
            .CountAsync(e => e.strWorkflowRuleGUID == id);

        return MapToListDto(rule, executionCount);
    }

    public async Task<WorkflowRuleListDto> CreateRuleAsync(CreateWorkflowRuleDto dto)
    {
        var rule = new MstWorkflowRule
        {
            strWorkflowRuleGUID = Guid.NewGuid(),
            strGroupGUID = GetTenantId(),
            strRuleName = dto.strRuleName,
            strEntityType = dto.strEntityType,
            strTriggerEvent = dto.strTriggerEvent,
            strTriggerConditionJson = dto.strTriggerConditionJson,
            strActionType = dto.strActionType,
            strActionConfigJson = dto.strActionConfigJson,
            intDelayMinutes = dto.intDelayMinutes,
            strCreatedByGUID = GetCurrentUserId(),
            dtCreatedOn = DateTime.UtcNow,
            bolIsActive = true
        };

        await _unitOfWork.WorkflowRules.AddAsync(rule);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(EntityTypeConstants.WorkflowRule, rule.strWorkflowRuleGUID, "Create",
            JsonSerializer.Serialize(new { dto.strRuleName, dto.strEntityType, dto.strTriggerEvent, dto.strActionType }),
            GetCurrentUserId());

        return MapToListDto(rule, 0);
    }

    public async Task<WorkflowRuleListDto> UpdateRuleAsync(Guid id, UpdateWorkflowRuleDto dto)
    {
        var rule = await _unitOfWork.WorkflowRules.GetByIdAsync(id);
        if (rule == null || rule.bolIsDeleted)
            throw new NotFoundException("Workflow rule not found", "WORKFLOW_RULE_NOT_FOUND");

        rule.strRuleName = dto.strRuleName;
        rule.strEntityType = dto.strEntityType;
        rule.strTriggerEvent = dto.strTriggerEvent;
        rule.strTriggerConditionJson = dto.strTriggerConditionJson;
        rule.strActionType = dto.strActionType;
        rule.strActionConfigJson = dto.strActionConfigJson;
        rule.intDelayMinutes = dto.intDelayMinutes;
        rule.bolIsActive = dto.bolIsActive;
        rule.strUpdatedByGUID = GetCurrentUserId();
        rule.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.WorkflowRules.Update(rule);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(EntityTypeConstants.WorkflowRule, rule.strWorkflowRuleGUID, "Update",
            null, GetCurrentUserId());

        var executionCount = await _unitOfWork.WorkflowExecutions.Query()
            .CountAsync(e => e.strWorkflowRuleGUID == id);

        return MapToListDto(rule, executionCount);
    }

    public async Task<bool> DeleteRuleAsync(Guid id)
    {
        var rule = await _unitOfWork.WorkflowRules.GetByIdAsync(id);
        if (rule == null || rule.bolIsDeleted)
            throw new NotFoundException("Workflow rule not found", "WORKFLOW_RULE_NOT_FOUND");

        rule.bolIsDeleted = true;
        rule.bolIsActive = false;
        rule.strUpdatedByGUID = GetCurrentUserId();
        rule.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.WorkflowRules.Update(rule);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(EntityTypeConstants.WorkflowRule, rule.strWorkflowRuleGUID, "Delete",
            null, GetCurrentUserId());

        return true;
    }

    public async Task<PagedResponse<WorkflowExecutionListDto>> GetExecutionsAsync(PagedRequestDto paging)
    {
        var query = _unitOfWork.WorkflowExecutions.Query();

        if (!string.IsNullOrWhiteSpace(paging.Search))
        {
            var search = paging.Search.ToLower();
            query = query.Where(e => e.strStatus.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .Join(
                _unitOfWork.WorkflowRules.Query(),
                exec => exec.strWorkflowRuleGUID,
                rule => rule.strWorkflowRuleGUID,
                (exec, rule) => new WorkflowExecutionListDto
                {
                    strExecutionGUID = exec.strExecutionGUID,
                    strWorkflowRuleGUID = exec.strWorkflowRuleGUID,
                    strEntityGUID = exec.strEntityGUID,
                    strStatus = exec.strStatus,
                    strResultJson = exec.strResultJson,
                    dtScheduledFor = exec.dtScheduledFor,
                    dtExecutedOn = exec.dtExecutedOn,
                    dtCreatedOn = exec.dtCreatedOn,
                    strRuleName = rule.strRuleName
                })
            .OrderByDescending(e => e.dtCreatedOn)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .ToListAsync();

        return new PagedResponse<WorkflowExecutionListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)paging.PageSize)
        };
    }

    public async Task<WorkflowExecutionListDto> GetExecutionByIdAsync(Guid id)
    {
        var execution = await _unitOfWork.WorkflowExecutions.GetByIdAsync(id);
        if (execution == null)
            throw new NotFoundException("Workflow execution not found", "WORKFLOW_EXECUTION_NOT_FOUND");

        var rule = await _unitOfWork.WorkflowRules.GetByIdAsync(execution.strWorkflowRuleGUID);

        return new WorkflowExecutionListDto
        {
            strExecutionGUID = execution.strExecutionGUID,
            strWorkflowRuleGUID = execution.strWorkflowRuleGUID,
            strEntityGUID = execution.strEntityGUID,
            strStatus = execution.strStatus,
            strResultJson = execution.strResultJson,
            dtScheduledFor = execution.dtScheduledFor,
            dtExecutedOn = execution.dtExecutedOn,
            dtCreatedOn = execution.dtCreatedOn,
            strRuleName = rule?.strRuleName
        };
    }

    private static WorkflowRuleListDto MapToListDto(MstWorkflowRule rule, int executionCount) => new()
    {
        strWorkflowRuleGUID = rule.strWorkflowRuleGUID,
        strRuleName = rule.strRuleName,
        strEntityType = rule.strEntityType,
        strTriggerEvent = rule.strTriggerEvent,
        strTriggerConditionJson = rule.strTriggerConditionJson,
        strActionType = rule.strActionType,
        strActionConfigJson = rule.strActionConfigJson,
        intDelayMinutes = rule.intDelayMinutes,
        bolIsActive = rule.bolIsActive,
        dtCreatedOn = rule.dtCreatedOn,
        intExecutionCount = executionCount
    };
}
