using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;
using System.Text.Json;

namespace crm_backend.Controllers;

[Route("api/crm/leads")]
[RequireTenantId]
public class LeadsController : BaseController
{
    private readonly IMstLeadApplicationService _leadAppService;
    private readonly IMstLeadAnalyticsApplicationService _analyticsAppService;
    private readonly IMstLeadAssignmentApplicationService _assignmentAppService;
    private readonly CrmDbContext _crmDbContext;
    private readonly MasterDbContext _masterDbContext;
    private readonly ILogger<LeadsController> _logger;

    public LeadsController(
        IMstLeadApplicationService leadAppService,
        IMstLeadAnalyticsApplicationService analyticsAppService,
        IMstLeadAssignmentApplicationService assignmentAppService,
        CrmDbContext crmDbContext,
        MasterDbContext masterDbContext,
        ILogger<LeadsController> logger)
    {
        _leadAppService = leadAppService;
        _analyticsAppService = analyticsAppService;
        _assignmentAppService = assignmentAppService;
        _crmDbContext = crmDbContext;
        _masterDbContext = masterDbContext;
        _logger = logger;
    }

    /// <summary>
    /// List leads (paged, filtered)
    /// </summary>
    [HttpGet]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<LeadListDto>>>> GetLeads(
        [FromQuery] LeadFilterParams filter)
    {
        var result = await _leadAppService.GetLeadsAsync(filter);
        return OkResponse(result);
    }

    /// <summary>
    /// Get lead detail by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<LeadDetailDto>>> GetLead(Guid id)
    {
        var result = await _leadAppService.GetLeadByIdAsync(id);
        return OkResponse(result);
    }

    /// <summary>
    /// Create a new lead
    /// </summary>
    [HttpPost]
    [AuthorizePermission("CRM_Leads", "Create")]
    [AuditLog(EntityTypeConstants.Lead, "Create")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<LeadDetailDto>>> CreateLead(
        [FromBody] CreateLeadDto dto)
    {
        var result = await _leadAppService.CreateLeadAsync(dto);
        return CreatedResponse(result);
    }

    /// <summary>
    /// Update an existing lead
    /// </summary>
    [HttpPut("{id:guid}")]
    [AuthorizePermission("CRM_Leads", "Edit")]
    [AuditLog(EntityTypeConstants.Lead, "Update")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<LeadDetailDto>>> UpdateLead(
        Guid id, [FromBody] UpdateLeadDto dto)
    {
        var result = await _leadAppService.UpdateLeadAsync(id, dto);
        return OkResponse(result);
    }

    /// <summary>
    /// Soft delete a lead
    /// </summary>
    [HttpDelete("{id:guid}")]
    [AuthorizePermission("CRM_Leads", "Delete")]
    [AuditLog(EntityTypeConstants.Lead, "Delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteLead(Guid id)
    {
        var result = await _leadAppService.DeleteLeadAsync(id);
        return OkResponse(result, "Lead deleted successfully");
    }

    /// <summary>
    /// Change lead status
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [AuthorizePermission("CRM_Leads", "Edit")]
    [AuditLog(EntityTypeConstants.Lead, "Update")]
    public async Task<ActionResult<ApiResponse<LeadDetailDto>>> ChangeStatus(
        Guid id, [FromBody] LeadStatusChangeDto dto)
    {
        var result = await _leadAppService.ChangeStatusAsync(id, dto.strStatus);
        return OkResponse(result);
    }

    /// <summary>
    /// Bulk archive leads
    /// </summary>
    [HttpPost("bulk-archive")]
    [AuthorizePermission("CRM_Leads", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkArchive(
        [FromBody] LeadBulkArchiveDto dto)
    {
        var result = await _leadAppService.BulkArchiveAsync(dto);
        return OkResponse(result, "Leads archived successfully");
    }

    /// <summary>
    /// Bulk restore leads
    /// </summary>
    [HttpPost("bulk-restore")]
    [AuthorizePermission("CRM_Leads", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkRestore(
        [FromBody] LeadBulkArchiveDto dto)
    {
        var result = await _leadAppService.BulkRestoreAsync(dto);
        return OkResponse(result, "Leads restored successfully");
    }

    /// <summary>
    /// Bulk manual assignment for selected leads.
    /// </summary>
    [HttpPost("bulk-assign")]
    [AuthorizePermission("CRM_Leads", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkAssign(
        [FromBody] LeadBulkAssignDto dto)
    {
        if (dto.guids == null || dto.guids.Count == 0)
            return OkResponse(true, "No leads selected");

        var distinctLeadIds = dto.guids.Distinct().ToList();
        foreach (var leadId in distinctLeadIds)
        {
            await _assignmentAppService.ManualAssignAsync(new ManualAssignDto
            {
                strLeadGUID = leadId,
                strAssignToGUID = dto.strAssignedToGUID
            });
        }

        return OkResponse(true, "Leads assigned successfully");
    }

    /// <summary>
    /// Bulk auto-assignment for selected leads.
    /// </summary>
    [HttpPost("auto-assign")]
    [AuthorizePermission("CRM_Leads", "Edit")]
    public async Task<ActionResult<ApiResponse<LeadAutoAssignResultDto>>> AutoAssign(
        [FromBody] LeadAutoAssignRequestDto dto)
    {
        var response = new LeadAutoAssignResultDto();
        if (dto.guids == null || dto.guids.Count == 0)
            return OkResponse(response);

        var assignmentItems = new List<LeadAutoAssignItemDto>();
        foreach (var leadId in dto.guids.Distinct())
        {
            var result = await _assignmentAppService.AutoAssignLeadAsync(leadId);
            if (result?.strAssignedToGUID.HasValue == true)
            {
                assignmentItems.Add(new LeadAutoAssignItemDto
                {
                    strLeadGUID = result.strLeadGUID,
                    strAssignedToGUID = result.strAssignedToGUID.Value,
                    strAssignedToName = string.Empty
                });
            }
        }

        var assignedUserIds = assignmentItems
            .Select(a => a.strAssignedToGUID)
            .Distinct()
            .ToList();

        if (assignedUserIds.Count > 0)
        {
            var nameById = await _masterDbContext.MstUsers.AsNoTracking()
                .Where(u => u.strGroupGUID == GetGroupGuid() && assignedUserIds.Contains(u.strUserGUID))
                .Select(u => new { u.strUserGUID, u.strName })
                .ToDictionaryAsync(u => u.strUserGUID, u => u.strName);

            foreach (var item in assignmentItems)
            {
                if (nameById.TryGetValue(item.strAssignedToGUID, out var name))
                    item.strAssignedToName = name;
            }
        }

        response.intAssigned = assignmentItems.Count;
        response.assignments = assignmentItems;
        return OkResponse(response);
    }

    /// <summary>
    /// Lead analytics summary used by the Leads list funnel widget.
    /// </summary>
    [HttpGet("analytics")]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<LeadListAnalyticsDto>>> GetAnalytics(
        [FromQuery] AnalyticsDateRangeParams dateRange)
    {
        var dashboard = await _analyticsAppService.GetDashboardAsync();
        var funnel = await _analyticsAppService.GetFunnelAsync(dateRange);
        var timeToConversion = await _analyticsAppService.GetTimeToConversionAsync(dateRange);
        var velocity = await _analyticsAppService.GetVelocityAsync(dateRange);
        var conversionByRep = await _analyticsAppService.GetConversionByRepAsync(dateRange);

        var total = funnel.Stages.FirstOrDefault()?.intCount ?? 0;
        var funnelStages = funnel.Stages.Select(s => new LeadFunnelStageDto
        {
            strStatus = s.strStatus,
            intCount = s.intCount,
            dblPercentage = total > 0 ? Math.Round((double)s.intCount / total * 100, 2) : 0
        }).ToList();

        var repIds = conversionByRep.Select(r => r.strAssignedToGUID).Distinct().ToList();
        var repNameById = await _masterDbContext.MstUsers.AsNoTracking()
            .Where(u => repIds.Contains(u.strUserGUID))
            .Select(u => new { u.strUserGUID, u.strName })
            .ToDictionaryAsync(u => u.strUserGUID, u => u.strName);

        var repPerformance = conversionByRep.Select(r => new LeadRepPerformanceDto
        {
            strRepName = repNameById.TryGetValue(r.strAssignedToGUID, out var name) ? name : r.strAssignedToGUID.ToString(),
            intTotal = r.intTotal,
            intConverted = r.intConverted,
            dblConversionRate = r.dblConversionRate
        }).ToList();

        var newThisWeek = velocity.Periods.LastOrDefault()?.intNewLeads ?? 0;

        var dto = new LeadListAnalyticsDto
        {
            funnel = funnelStages,
            dblConversionRate = dashboard.dblConversionRate,
            dblAvgTimeToConversionDays = timeToConversion.dblAverageDays,
            intNewThisWeek = newThisWeek,
            intConvertedThisMonth = dashboard.intConvertedThisMonth,
            sourceBreakdown = dashboard.SourceBreakdown.Select(s => new LeadSourceBreakdownDto
            {
                strSource = s.strSource,
                intCount = s.intCount,
                intConverted = s.intConverted
            }).ToList(),
            repPerformance = repPerformance
        };

        return OkResponse(dto);
    }

    /// <summary>
    /// Backward-compatible duplicate check endpoint for lead-create flow.
    /// </summary>
    [HttpGet("check-duplicates")]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<DuplicateCheckResultDto>>> CheckDuplicates(
        [FromQuery] string email,
        [FromQuery] string? firstName,
        [FromQuery] string? lastName)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return OkResponse(new DuplicateCheckResultDto
            {
                bolHasDuplicates = false,
                duplicates = new List<LeadDuplicateDto>()
            });
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var normalizedFirstName = firstName?.Trim().ToLowerInvariant();
        var normalizedLastName = lastName?.Trim().ToLowerInvariant();

        var candidates = await _crmDbContext.MstLeads
            .AsNoTracking()
            .Where(l => !l.bolIsDeleted && l.strEmail.ToLower() == normalizedEmail)
            .Take(10)
            .ToListAsync();

        var duplicates = candidates.Select(l =>
        {
            var nameScore = 0d;
            if (!string.IsNullOrWhiteSpace(normalizedFirstName) &&
                l.strFirstName.Equals(normalizedFirstName, StringComparison.OrdinalIgnoreCase))
            {
                nameScore += 0.15d;
            }

            if (!string.IsNullOrWhiteSpace(normalizedLastName) &&
                l.strLastName.Equals(normalizedLastName, StringComparison.OrdinalIgnoreCase))
            {
                nameScore += 0.15d;
            }

            var score = Math.Min(1d, 0.7d + nameScore);
            return new LeadDuplicateDto
            {
                strLeadGUID = l.strLeadGUID,
                strFirstName = l.strFirstName,
                strLastName = l.strLastName,
                strEmail = l.strEmail,
                strCompanyName = l.strCompanyName,
                strStatus = l.strStatus,
                dblMatchScore = score,
                strMatchReason = "Email match"
            };
        }).ToList();

        return OkResponse(new DuplicateCheckResultDto
        {
            bolHasDuplicates = duplicates.Count > 0,
            duplicates = duplicates
        });
    }

    /// <summary>
    /// Assignment rules summary used by the Leads bulk assignment dialog.
    /// </summary>
    [HttpGet("assignment-rules")]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<List<LeadAssignmentRuleDto>>>> GetAssignmentRules()
    {
        var rules = await _assignmentAppService.GetRulesAsync(new AssignmentRuleFilterParams
        {
            PageNumber = 1,
            PageSize = 2000
        });

        var result = new List<LeadAssignmentRuleDto>();
        foreach (var rule in rules.Items)
        {
            string? territoryField = null;
            List<string>? territoryValues = null;
            string? description = null;

            if (string.Equals(rule.strAssignmentType, AssignmentTypeConstants.Territory, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(rule.strConditionJson))
            {
                try
                {
                    var conditions = JsonSerializer.Deserialize<Dictionary<string, string>>(rule.strConditionJson);
                    if (conditions != null)
                    {
                        var knownKeys = new[] { "city", "state", "country" };
                        foreach (var key in knownKeys)
                        {
                            if (conditions.TryGetValue(key, out var val) && !string.IsNullOrWhiteSpace(val))
                            {
                                territoryField = key;
                                territoryValues = new List<string> { val };
                                break;
                            }
                        }

                        description = string.Join(", ",
                            knownKeys.Where(k => conditions.TryGetValue(k, out var v) && !string.IsNullOrWhiteSpace(v))
                                .Select(k => $"{k}={conditions[k]}"));
                        if (string.IsNullOrWhiteSpace(description))
                            description = null;
                    }
                }
                catch
                {
                    // Ignore malformed condition JSON; keep summary response functional.
                }
            }

            result.Add(new LeadAssignmentRuleDto
            {
                strRuleGUID = rule.strAssignmentRuleGUID,
                strStrategy = rule.strAssignmentType,
                strRuleName = rule.strRuleName,
                strDescription = description,
                strTerritoryField = territoryField,
                strTerritoryValues = territoryValues,
                bolIsActive = rule.bolIsActive,
                intPriority = rule.intPriority
            });
        }

        return OkResponse(result);
    }
}
