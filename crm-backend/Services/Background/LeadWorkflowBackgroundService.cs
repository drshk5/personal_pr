using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using crm_backend.Constants;
using crm_backend.DataAccess.Repositories;
using crm_backend.Hubs;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Services.Background;

public class LeadWorkflowBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LeadWorkflowBackgroundService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

    public LeadWorkflowBackgroundService(IServiceScopeFactory scopeFactory, ILogger<LeadWorkflowBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("LeadWorkflowBackgroundService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogDebug("LeadWorkflowBackgroundService tick starting");

                using var scope = _scopeFactory.CreateScope();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                var workflowService = scope.ServiceProvider.GetRequiredService<IWorkflowService>();
                var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<CrmNotificationHub>>();

                await ProcessPendingWorkflowExecutionsAsync(workflowService);
                await ApplyLeadScoreDecayAsync(unitOfWork);
                await CheckSlaViolationsAsync(unitOfWork, hubContext);
                await AutoArchiveAgingLeadsAsync(unitOfWork);

                _logger.LogDebug("LeadWorkflowBackgroundService tick completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in LeadWorkflowBackgroundService");
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("LeadWorkflowBackgroundService stopped");
    }

    private async Task ProcessPendingWorkflowExecutionsAsync(IWorkflowService workflowService)
    {
        try
        {
            await workflowService.ProcessPendingExecutionsAsync();
            _logger.LogDebug("Processed pending workflow executions");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing pending workflow executions");
        }
    }

    private async Task ApplyLeadScoreDecayAsync(IUnitOfWork unitOfWork)
    {
        try
        {
            var decayRules = await unitOfWork.LeadScoringRules
                .GetActiveRulesByCategoryAsync(ScoringRuleCategoryConstants.Decay);

            if (!decayRules.Any())
                return;

            var activeLeads = await unitOfWork.Leads.Query()
                .Where(l => l.bolIsActive && !l.bolIsDeleted && l.strStatus != LeadStatusConstants.Converted)
                .ToListAsync();

            foreach (var lead in activeLeads)
            {
                var lastActivity = await unitOfWork.Activities.Query()
                    .Join(unitOfWork.ActivityLinks.Query(),
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
                            unitOfWork.Leads.Update(lead);

                            var history = new MstLeadScoreHistory
                            {
                                strScoreHistoryGUID = Guid.NewGuid(),
                                strGroupGUID = lead.strGroupGUID,
                                strLeadGUID = lead.strLeadGUID,
                                intPreviousScore = oldScore,
                                intNewScore = lead.intLeadScore,
                                intScoreChange = lead.intLeadScore - oldScore,
                                strChangeReason = $"Decay: {daysSinceActivity} days inactivity (rule: {rule.strRuleName})",
                                strScoringRuleGUID = rule.strScoringRuleGUID,
                                dtCreatedOn = DateTime.UtcNow
                            };

                            await unitOfWork.LeadScoreHistory.AddAsync(history);
                        }
                    }
                }
            }

            await unitOfWork.SaveChangesAsync();
            _logger.LogDebug("Applied lead score decay rules");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying lead score decay");
        }
    }

    private async Task CheckSlaViolationsAsync(IUnitOfWork unitOfWork, IHubContext<CrmNotificationHub> hubContext)
    {
        try
        {
            var slaThreshold = DateTime.UtcNow.AddDays(-7);

            var violatingLeads = await unitOfWork.Leads.Query()
                .Where(l => l.bolIsActive
                            && !l.bolIsDeleted
                            && l.strStatus != LeadStatusConstants.Converted
                            && l.strStatus != LeadStatusConstants.Unqualified
                            && (l.dtUpdatedOn ?? l.dtCreatedOn) < slaThreshold)
                .Select(l => new
                {
                    l.strLeadGUID,
                    l.strGroupGUID,
                    l.strFirstName,
                    l.strLastName,
                    l.strStatus,
                    l.strAssignedToGUID,
                    LastUpdated = l.dtUpdatedOn ?? l.dtCreatedOn
                })
                .ToListAsync();

            var groupedByTenant = violatingLeads.GroupBy(l => l.strGroupGUID);

            foreach (var tenantGroup in groupedByTenant)
            {
                var notification = new
                {
                    type = "SlaViolation",
                    title = "SLA Violation Alert",
                    message = $"{tenantGroup.Count()} lead(s) have not been updated in over 7 days",
                    leads = tenantGroup.Select(l => new
                    {
                        l.strLeadGUID,
                        name = $"{l.strFirstName} {l.strLastName}",
                        l.strStatus,
                        l.strAssignedToGUID,
                        daysSinceUpdate = (DateTime.UtcNow - l.LastUpdated).Days
                    }),
                    timestamp = DateTime.UtcNow
                };

                await hubContext.Clients.Group(tenantGroup.Key.ToString())
                    .SendAsync("ReceiveNotification", notification);
            }

            if (violatingLeads.Any())
            {
                _logger.LogInformation("Sent SLA violation alerts for {Count} leads across {TenantCount} tenants",
                    violatingLeads.Count, groupedByTenant.Count());
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking SLA violations");
        }
    }

    private async Task AutoArchiveAgingLeadsAsync(IUnitOfWork unitOfWork)
    {
        try
        {
            var agingThreshold = DateTime.UtcNow.AddDays(-90);

            var agingLeads = await unitOfWork.Leads.Query()
                .Where(l => l.bolIsActive
                            && !l.bolIsDeleted
                            && l.strStatus != LeadStatusConstants.Converted
                            && (l.dtUpdatedOn ?? l.dtCreatedOn) < agingThreshold)
                .ToListAsync();

            var leadsToArchive = new List<MstLead>();

            foreach (var lead in agingLeads)
            {
                var hasRecentActivity = await unitOfWork.Activities.Query()
                    .Join(unitOfWork.ActivityLinks.Query(),
                        a => a.strActivityGUID,
                        al => al.strActivityGUID,
                        (a, al) => new { Activity = a, Link = al })
                    .Where(x => x.Link.strEntityType == EntityTypeConstants.Lead
                                && x.Link.strEntityGUID == lead.strLeadGUID
                                && x.Activity.dtCreatedOn >= agingThreshold)
                    .AnyAsync();

                if (!hasRecentActivity)
                {
                    leadsToArchive.Add(lead);
                }
            }

            foreach (var lead in leadsToArchive)
            {
                lead.bolIsActive = false;
                lead.dtUpdatedOn = DateTime.UtcNow;
                unitOfWork.Leads.Update(lead);
            }

            if (leadsToArchive.Any())
            {
                await unitOfWork.SaveChangesAsync();
                _logger.LogInformation("Auto-archived {Count} aging leads (inactive for 90+ days with no activity)", leadsToArchive.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error auto-archiving aging leads");
        }
    }
}
