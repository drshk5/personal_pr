using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using crm_backend.Constants;
using crm_backend.DataAccess.Repositories;
using crm_backend.Hubs;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using MstActivityModel = crm_backend.Models.Core.CustomerData.MstActivity;

namespace crm_backend.Services.CustomerData;

public class MstWorkflowService : IWorkflowService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<CrmNotificationHub> _hubContext;
    private readonly ILogger<MstWorkflowService> _logger;

    public MstWorkflowService(
        IUnitOfWork unitOfWork,
        IHubContext<CrmNotificationHub> hubContext,
        ILogger<MstWorkflowService> logger)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task TriggerWorkflowsAsync(string entityType, Guid entityGuid, string triggerEvent,
        Guid tenantId, Guid performedByGuid, string? contextJson = null)
    {
        var matchingRules = await _unitOfWork.WorkflowRules.Query()
            .Where(r => r.strGroupGUID == tenantId
                        && r.strEntityType == entityType
                        && r.strTriggerEvent == triggerEvent
                        && r.bolIsActive
                        && !r.bolIsDeleted)
            .OrderBy(r => r.dtCreatedOn)
            .ToListAsync();

        foreach (var rule in matchingRules)
        {
            try
            {
                if (!EvaluateCondition(rule.strTriggerConditionJson, contextJson))
                {
                    _logger.LogDebug("Workflow rule {RuleId} condition not met for entity {EntityId}",
                        rule.strWorkflowRuleGUID, entityGuid);
                    continue;
                }

                if (rule.intDelayMinutes > 0)
                {
                    var execution = new MstWorkflowExecution
                    {
                        strExecutionGUID = Guid.NewGuid(),
                        strGroupGUID = tenantId,
                        strWorkflowRuleGUID = rule.strWorkflowRuleGUID,
                        strEntityGUID = entityGuid,
                        strStatus = "Pending",
                        dtScheduledFor = DateTime.UtcNow.AddMinutes(rule.intDelayMinutes),
                        dtCreatedOn = DateTime.UtcNow
                    };

                    await _unitOfWork.WorkflowExecutions.AddAsync(execution);
                    await _unitOfWork.SaveChangesAsync();

                    _logger.LogInformation("Scheduled deferred workflow execution {ExecutionId} for rule {RuleId}, scheduled at {ScheduledFor}",
                        execution.strExecutionGUID, rule.strWorkflowRuleGUID, execution.dtScheduledFor);
                }
                else
                {
                    var execution = new MstWorkflowExecution
                    {
                        strExecutionGUID = Guid.NewGuid(),
                        strGroupGUID = tenantId,
                        strWorkflowRuleGUID = rule.strWorkflowRuleGUID,
                        strEntityGUID = entityGuid,
                        strStatus = "Pending",
                        dtScheduledFor = DateTime.UtcNow,
                        dtCreatedOn = DateTime.UtcNow
                    };

                    await _unitOfWork.WorkflowExecutions.AddAsync(execution);
                    await _unitOfWork.SaveChangesAsync();

                    await ExecuteActionAsync(execution, rule);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error triggering workflow rule {RuleId} for entity {EntityId}",
                    rule.strWorkflowRuleGUID, entityGuid);
            }
        }
    }

    public async Task ProcessPendingExecutionsAsync()
    {
        var pendingExecutions = await _unitOfWork.WorkflowExecutions.GetPendingExecutionsAsync();

        foreach (var execution in pendingExecutions)
        {
            try
            {
                var rule = execution.WorkflowRule
                    ?? await _unitOfWork.WorkflowRules.GetByIdAsync(execution.strWorkflowRuleGUID);

                if (rule == null || !rule.bolIsActive || rule.bolIsDeleted)
                {
                    execution.strStatus = "Skipped";
                    execution.strResultJson = JsonSerializer.Serialize(new { reason = "Rule inactive or deleted" });
                    execution.dtExecutedOn = DateTime.UtcNow;
                    _unitOfWork.WorkflowExecutions.Update(execution);
                    await _unitOfWork.SaveChangesAsync();
                    continue;
                }

                await ExecuteActionAsync(execution, rule);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing pending execution {ExecutionId}", execution.strExecutionGUID);

                execution.strStatus = "Failed";
                execution.strResultJson = JsonSerializer.Serialize(new { error = ex.Message });
                execution.dtExecutedOn = DateTime.UtcNow;
                _unitOfWork.WorkflowExecutions.Update(execution);
                await _unitOfWork.SaveChangesAsync();
            }
        }
    }

    private async Task ExecuteActionAsync(MstWorkflowExecution execution, MstWorkflowRule rule)
    {
        try
        {
            switch (rule.strActionType)
            {
                case WorkflowActionConstants.CreateTask:
                    await ExecuteCreateTaskAsync(execution, rule);
                    break;

                case WorkflowActionConstants.SendNotification:
                    await ExecuteSendNotificationAsync(execution, rule);
                    break;

                case WorkflowActionConstants.ChangeStatus:
                    await ExecuteChangeStatusAsync(execution, rule);
                    break;

                case WorkflowActionConstants.Archive:
                    await ExecuteArchiveAsync(execution, rule);
                    break;

                case WorkflowActionConstants.UpdateEntityStatus:
                    await ExecuteUpdateEntityStatusAsync(execution, rule);
                    break;

                case WorkflowActionConstants.CreateFollowUp:
                    await ExecuteCreateFollowUpAsync(execution, rule);
                    break;

                case WorkflowActionConstants.AssignActivity:
                    await ExecuteAssignActivityAsync(execution, rule);
                    break;

                default:
                    execution.strStatus = "Failed";
                    execution.strResultJson = JsonSerializer.Serialize(new { error = $"Unknown action type: {rule.strActionType}" });
                    execution.dtExecutedOn = DateTime.UtcNow;
                    _unitOfWork.WorkflowExecutions.Update(execution);
                    await _unitOfWork.SaveChangesAsync();
                    return;
            }

            execution.strStatus = "Executed";
            execution.strResultJson = JsonSerializer.Serialize(new { action = rule.strActionType, success = true });
            execution.dtExecutedOn = DateTime.UtcNow;
            _unitOfWork.WorkflowExecutions.Update(execution);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Workflow execution {ExecutionId} completed successfully for rule {RuleId}",
                execution.strExecutionGUID, rule.strWorkflowRuleGUID);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Workflow execution {ExecutionId} failed for rule {RuleId}",
                execution.strExecutionGUID, rule.strWorkflowRuleGUID);

            execution.strStatus = "Failed";
            execution.strResultJson = JsonSerializer.Serialize(new { error = ex.Message });
            execution.dtExecutedOn = DateTime.UtcNow;
            _unitOfWork.WorkflowExecutions.Update(execution);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    private async Task ExecuteCreateTaskAsync(MstWorkflowExecution execution, MstWorkflowRule rule)
    {
        var config = ParseActionConfig(rule.strActionConfigJson);
        var subject = config.GetValueOrDefault("subject", $"Workflow Task: {rule.strRuleName}");
        var description = config.GetValueOrDefault("description", $"Auto-created by workflow rule: {rule.strRuleName}");
        var activityType = config.GetValueOrDefault("activityType", "Task");

        var activity = new MstActivityModel
        {
            strActivityGUID = Guid.NewGuid(),
            strGroupGUID = execution.strGroupGUID,
            strActivityType = activityType,
            strSubject = subject,
            strDescription = description,
            dtScheduledOn = DateTime.UtcNow,
            strCreatedByGUID = rule.strCreatedByGUID,
            dtCreatedOn = DateTime.UtcNow,
            bolIsActive = true
        };

        // Try to assign the task to the lead's assigned user
        if (rule.strEntityType == EntityTypeConstants.Lead)
        {
            var lead = await _unitOfWork.Leads.GetByIdAsync(execution.strEntityGUID);
            if (lead?.strAssignedToGUID != null)
            {
                activity.strAssignedToGUID = lead.strAssignedToGUID;
            }
        }

        await _unitOfWork.Activities.AddAsync((MstActivity)activity);

        var activityLink = new MstActivityLink
        {
            strActivityLinkGUID = Guid.NewGuid(),
            strActivityGUID = activity.strActivityGUID,
            strEntityType = rule.strEntityType,
            strEntityGUID = execution.strEntityGUID,
            dtCreatedOn = DateTime.UtcNow
        };

        await _unitOfWork.ActivityLinks.AddAsync(activityLink);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Created task activity {ActivityId} for entity {EntityId} via workflow rule {RuleId}",
            activity.strActivityGUID, execution.strEntityGUID, rule.strWorkflowRuleGUID);
    }

    private async Task ExecuteSendNotificationAsync(MstWorkflowExecution execution, MstWorkflowRule rule)
    {
        var config = ParseActionConfig(rule.strActionConfigJson);
        var title = config.GetValueOrDefault("title", $"Workflow Notification: {rule.strRuleName}");
        var message = config.GetValueOrDefault("message", $"Workflow rule '{rule.strRuleName}' triggered for entity {execution.strEntityGUID}");

        var notification = new
        {
            type = "WorkflowNotification",
            title,
            message,
            entityType = rule.strEntityType,
            entityGuid = execution.strEntityGUID,
            ruleGuid = rule.strWorkflowRuleGUID,
            timestamp = DateTime.UtcNow
        };

        await _hubContext.Clients.Group(execution.strGroupGUID.ToString())
            .SendAsync("ReceiveNotification", notification);

        _logger.LogInformation("Sent workflow notification to tenant group {TenantId} for rule {RuleId}",
            execution.strGroupGUID, rule.strWorkflowRuleGUID);
    }

    private async Task ExecuteChangeStatusAsync(MstWorkflowExecution execution, MstWorkflowRule rule)
    {
        if (rule.strEntityType != EntityTypeConstants.Lead)
        {
            _logger.LogWarning("ChangeStatus action is only supported for Lead entities. Rule {RuleId} targets {EntityType}",
                rule.strWorkflowRuleGUID, rule.strEntityType);
            return;
        }

        var config = ParseActionConfig(rule.strActionConfigJson);
        var newStatus = config.GetValueOrDefault("status", string.Empty);

        if (string.IsNullOrWhiteSpace(newStatus))
        {
            _logger.LogWarning("ChangeStatus action config missing 'status' field for rule {RuleId}", rule.strWorkflowRuleGUID);
            return;
        }

        var lead = await _unitOfWork.Leads.GetByIdAsync(execution.strEntityGUID);
        if (lead == null)
        {
            _logger.LogWarning("Lead {LeadId} not found for ChangeStatus workflow action", execution.strEntityGUID);
            return;
        }

        lead.strStatus = newStatus;
        lead.dtUpdatedOn = DateTime.UtcNow;
        _unitOfWork.Leads.Update(lead);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Changed lead {LeadId} status to '{NewStatus}' via workflow rule {RuleId}",
            lead.strLeadGUID, newStatus, rule.strWorkflowRuleGUID);
    }

    private async Task ExecuteArchiveAsync(MstWorkflowExecution execution, MstWorkflowRule rule)
    {
        if (rule.strEntityType != EntityTypeConstants.Lead)
        {
            _logger.LogWarning("Archive action is only supported for Lead entities. Rule {RuleId} targets {EntityType}",
                rule.strWorkflowRuleGUID, rule.strEntityType);
            return;
        }

        var lead = await _unitOfWork.Leads.GetByIdAsync(execution.strEntityGUID);
        if (lead == null)
        {
            _logger.LogWarning("Lead {LeadId} not found for Archive workflow action", execution.strEntityGUID);
            return;
        }

        lead.bolIsActive = false;
        lead.dtUpdatedOn = DateTime.UtcNow;
        _unitOfWork.Leads.Update(lead);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Archived lead {LeadId} via workflow rule {RuleId}",
            lead.strLeadGUID, rule.strWorkflowRuleGUID);
    }

    private async Task ExecuteUpdateEntityStatusAsync(MstWorkflowExecution execution, MstWorkflowRule rule)
    {
        var config = ParseActionConfig(rule.strActionConfigJson);
        var newStatus = config.GetValueOrDefault("status", string.Empty);

        if (string.IsNullOrWhiteSpace(newStatus))
        {
            _logger.LogWarning("UpdateEntityStatus action config missing 'status' field for rule {RuleId}", rule.strWorkflowRuleGUID);
            return;
        }

        var now = DateTime.UtcNow;

        switch (rule.strEntityType)
        {
            case EntityTypeConstants.Lead:
                var lead = await _unitOfWork.Leads.GetByIdAsync(execution.strEntityGUID);
                if (lead == null)
                {
                    _logger.LogWarning("Lead {LeadId} not found for UpdateEntityStatus workflow action", execution.strEntityGUID);
                    return;
                }
                lead.strStatus = newStatus;
                lead.dtUpdatedOn = now;
                _unitOfWork.Leads.Update(lead);
                await _unitOfWork.SaveChangesAsync();
                _logger.LogInformation("Updated lead {LeadId} status to {NewStatus} via workflow rule {RuleId}",
                    lead.strLeadGUID, newStatus, rule.strWorkflowRuleGUID);
                break;

            case EntityTypeConstants.Opportunity:
                var opportunity = await _unitOfWork.Opportunities.GetByIdAsync(execution.strEntityGUID);
                if (opportunity == null)
                {
                    _logger.LogWarning("Opportunity {OppId} not found for UpdateEntityStatus workflow action", execution.strEntityGUID);
                    return;
                }
                opportunity.strStatus = newStatus;
                opportunity.dtUpdatedOn = now;
                _unitOfWork.Opportunities.Update(opportunity);
                await _unitOfWork.SaveChangesAsync();
                _logger.LogInformation("Updated opportunity {OppId} stage to {NewStage} via workflow rule {RuleId}",
                    opportunity.strOpportunityGUID, newStatus, rule.strWorkflowRuleGUID);
                break;

            case EntityTypeConstants.Account:
                var account = await _unitOfWork.Accounts.GetByIdAsync(execution.strEntityGUID);
                if (account == null)
                {
                    _logger.LogWarning("Account {AccountId} not found for UpdateEntityStatus workflow action", execution.strEntityGUID);
                    return;
                }
                // Assuming Accounts have a status field. Adjust as needed based on actual schema
                // account.strStatus = newStatus;
                // account.dtUpdatedOn = now;
                // _unitOfWork.Accounts.Update(account);
                // await _unitOfWork.SaveChangesAsync();
                _logger.LogInformation("Account entity type doesn't support status change yet for rule {RuleId}", rule.strWorkflowRuleGUID);
                break;

            default:
                _logger.LogWarning("UpdateEntityStatus action not supported for entity type {EntityType}", rule.strEntityType);
                break;
        }
    }

    private async Task ExecuteCreateFollowUpAsync(MstWorkflowExecution execution, MstWorkflowRule rule)
    {
        var config = ParseActionConfig(rule.strActionConfigJson);
        var subject = config.GetValueOrDefault("subject", "Follow-up Activity");
        var description = config.GetValueOrDefault("description", $"Auto-created follow-up from workflow rule: {rule.strRuleName}");
        var daysAfter = int.TryParse(config.GetValueOrDefault("daysAfter", "1"), out var days) ? days : 1;

        var followUpActivity = new MstActivityModel
        {
            strActivityGUID = Guid.NewGuid(),
            strGroupGUID = execution.strGroupGUID,
            strActivityType = "FollowUp",
            strSubject = subject,
            strDescription = description,
            dtScheduledOn = DateTime.UtcNow.AddDays(daysAfter),
            dtDueDate = DateTime.UtcNow.AddDays(daysAfter),
            strStatus = ActivityStatusConstants.Pending,
            strPriority = ActivityPriorityConstants.Medium,
            strCreatedByGUID = rule.strCreatedByGUID,
            dtCreatedOn = DateTime.UtcNow,
            bolIsActive = true
        };

        // Assign to the entity's owner if applicable
        if (rule.strEntityType == EntityTypeConstants.Lead)
        {
            var lead = await _unitOfWork.Leads.GetByIdAsync(execution.strEntityGUID);
            if (lead?.strAssignedToGUID != null)
                followUpActivity.strAssignedToGUID = lead.strAssignedToGUID;
        }
        else if (rule.strEntityType == EntityTypeConstants.Opportunity)
        {
            var opportunity = await _unitOfWork.Opportunities.GetByIdAsync(execution.strEntityGUID);
            if (opportunity?.strAssignedToGUID != null)
                followUpActivity.strAssignedToGUID = opportunity.strAssignedToGUID;
        }

        await _unitOfWork.Activities.AddAsync((MstActivity)followUpActivity);

        var activityLink = new MstActivityLink
        {
            strActivityLinkGUID = Guid.NewGuid(),
            strActivityGUID = followUpActivity.strActivityGUID,
            strEntityType = rule.strEntityType,
            strEntityGUID = execution.strEntityGUID,
            dtCreatedOn = DateTime.UtcNow
        };

        await _unitOfWork.ActivityLinks.AddAsync(activityLink);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Created follow-up activity {ActivityId} for entity {EntityId} via workflow rule {RuleId}",
            followUpActivity.strActivityGUID, execution.strEntityGUID, rule.strWorkflowRuleGUID);
    }

    private async Task ExecuteAssignActivityAsync(MstWorkflowExecution execution, MstWorkflowRule rule)
    {
        var config = ParseActionConfig(rule.strActionConfigJson);
        var assignToUserIdStr = config.GetValueOrDefault("assignToUserId", string.Empty);

        if (!Guid.TryParse(assignToUserIdStr, out var assignToUserId))
        {
            _logger.LogWarning("AssignActivity action config missing or invalid 'assignToUserId' field for rule {RuleId}", rule.strWorkflowRuleGUID);
            return;
        }

        // For Activity entities themselves
        if (rule.strEntityType == EntityTypeConstants.Activity)
        {
            var activity = await _unitOfWork.Activities.GetByIdAsync(execution.strEntityGUID);
            if (activity == null)
            {
                _logger.LogWarning("Activity {ActivityId} not found for AssignActivity workflow action", execution.strEntityGUID);
                return;
            }

            activity.strAssignedToGUID = assignToUserId;
            activity.dtUpdatedOn = DateTime.UtcNow;
            _unitOfWork.Activities.Update(activity);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Assigned activity {ActivityId} to user {UserId} via workflow rule {RuleId}",
                activity.strActivityGUID, assignToUserId, rule.strWorkflowRuleGUID);
        }
        else
        {
            _logger.LogWarning("AssignActivity action is only supported for Activity entities. Rule {RuleId} targets {EntityType}",
                rule.strWorkflowRuleGUID, rule.strEntityType);
        }
    }

    private static bool EvaluateCondition(string? conditionJson, string? contextJson)
    {
        if (string.IsNullOrWhiteSpace(conditionJson))
            return true;

        if (string.IsNullOrWhiteSpace(contextJson))
            return false;

        try
        {
            var condition = JsonSerializer.Deserialize<Dictionary<string, string>>(conditionJson);
            var context = JsonSerializer.Deserialize<Dictionary<string, string>>(contextJson);

            if (condition == null || context == null)
                return true;

            foreach (var kvp in condition)
            {
                if (!context.TryGetValue(kvp.Key, out var contextValue))
                    return false;

                if (!string.Equals(contextValue, kvp.Value, StringComparison.OrdinalIgnoreCase))
                    return false;
            }

            return true;
        }
        catch
        {
            return true;
        }
    }

    private static Dictionary<string, string> ParseActionConfig(string? actionConfigJson)
    {
        if (string.IsNullOrWhiteSpace(actionConfigJson))
            return new Dictionary<string, string>();

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(actionConfigJson)
                   ?? new Dictionary<string, string>();
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }
}
