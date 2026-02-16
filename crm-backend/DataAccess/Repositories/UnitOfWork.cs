using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;

namespace crm_backend.DataAccess.Repositories;

public interface IUnitOfWork : IDisposable
{
    IMstLeadRepository Leads { get; }
    IMstContactRepository Contacts { get; }
    IMstAccountRepository Accounts { get; }
    IMstOpportunityRepository Opportunities { get; }
    IMstOpportunityContactRepository OpportunityContacts { get; }
    IMstPipelineRepository Pipelines { get; }
    IMstPipelineStageRepository PipelineStages { get; }
    IMstActivityRepository Activities { get; }
    IMstActivityLinkRepository ActivityLinks { get; }
    IMstAuditLogRepository AuditLogs { get; }
    IMstLeadScoringRuleRepository LeadScoringRules { get; }
    IMstLeadScoreHistoryRepository LeadScoreHistory { get; }
    IMstLeadAssignmentRuleRepository LeadAssignmentRules { get; }
    IMstLeadAssignmentMemberRepository LeadAssignmentMembers { get; }
    IMstLeadDuplicateRepository LeadDuplicates { get; }
    IMstLeadMergeHistoryRepository LeadMergeHistory { get; }
    IMstWorkflowRuleRepository WorkflowRules { get; }
    IMstWorkflowExecutionRepository WorkflowExecutions { get; }
    IMstWebFormRepository WebForms { get; }
    IMstWebFormFieldRepository WebFormFields { get; }
    IMstWebFormSubmissionRepository WebFormSubmissions { get; }
    IMstImportJobRepository ImportJobs { get; }
    IMstImportJobErrorRepository ImportJobErrors { get; }
    IMstLeadCommunicationRepository LeadCommunications { get; }
    Task<int> SaveChangesAsync();
}

public class UnitOfWork : IUnitOfWork
{
    private readonly CrmDbContext _context;

    public IMstLeadRepository Leads { get; }
    public IMstContactRepository Contacts { get; }
    public IMstAccountRepository Accounts { get; }
    public IMstOpportunityRepository Opportunities { get; }
    public IMstOpportunityContactRepository OpportunityContacts { get; }
    public IMstPipelineRepository Pipelines { get; }
    public IMstPipelineStageRepository PipelineStages { get; }
    public IMstActivityRepository Activities { get; }
    public IMstActivityLinkRepository ActivityLinks { get; }
    public IMstAuditLogRepository AuditLogs { get; }
    public IMstLeadScoringRuleRepository LeadScoringRules { get; }
    public IMstLeadScoreHistoryRepository LeadScoreHistory { get; }
    public IMstLeadAssignmentRuleRepository LeadAssignmentRules { get; }
    public IMstLeadAssignmentMemberRepository LeadAssignmentMembers { get; }
    public IMstLeadDuplicateRepository LeadDuplicates { get; }
    public IMstLeadMergeHistoryRepository LeadMergeHistory { get; }
    public IMstWorkflowRuleRepository WorkflowRules { get; }
    public IMstWorkflowExecutionRepository WorkflowExecutions { get; }
    public IMstWebFormRepository WebForms { get; }
    public IMstWebFormFieldRepository WebFormFields { get; }
    public IMstWebFormSubmissionRepository WebFormSubmissions { get; }
    public IMstImportJobRepository ImportJobs { get; }
    public IMstImportJobErrorRepository ImportJobErrors { get; }
    public IMstLeadCommunicationRepository LeadCommunications { get; }

    public UnitOfWork(
        CrmDbContext context,
        IMstLeadRepository leads,
        IMstContactRepository contacts,
        IMstAccountRepository accounts,
        IMstOpportunityRepository opportunities,
        IMstOpportunityContactRepository opportunityContacts,
        IMstPipelineRepository pipelines,
        IMstPipelineStageRepository pipelineStages,
        IMstActivityRepository activities,
        IMstActivityLinkRepository activityLinks,
        IMstAuditLogRepository auditLogs,
        IMstLeadScoringRuleRepository leadScoringRules,
        IMstLeadScoreHistoryRepository leadScoreHistory,
        IMstLeadAssignmentRuleRepository leadAssignmentRules,
        IMstLeadAssignmentMemberRepository leadAssignmentMembers,
        IMstLeadDuplicateRepository leadDuplicates,
        IMstLeadMergeHistoryRepository leadMergeHistory,
        IMstWorkflowRuleRepository workflowRules,
        IMstWorkflowExecutionRepository workflowExecutions,
        IMstWebFormRepository webForms,
        IMstWebFormFieldRepository webFormFields,
        IMstWebFormSubmissionRepository webFormSubmissions,
        IMstImportJobRepository importJobs,
        IMstImportJobErrorRepository importJobErrors,
        IMstLeadCommunicationRepository leadCommunications)
    {
        _context = context;
        Leads = leads;
        Contacts = contacts;
        Accounts = accounts;
        Opportunities = opportunities;
        OpportunityContacts = opportunityContacts;
        Pipelines = pipelines;
        PipelineStages = pipelineStages;
        Activities = activities;
        ActivityLinks = activityLinks;
        AuditLogs = auditLogs;
        LeadScoringRules = leadScoringRules;
        LeadScoreHistory = leadScoreHistory;
        LeadAssignmentRules = leadAssignmentRules;
        LeadAssignmentMembers = leadAssignmentMembers;
        LeadDuplicates = leadDuplicates;
        LeadMergeHistory = leadMergeHistory;
        WorkflowRules = workflowRules;
        WorkflowExecutions = workflowExecutions;
        WebForms = webForms;
        WebFormFields = webFormFields;
        WebFormSubmissions = webFormSubmissions;
        ImportJobs = importJobs;
        ImportJobErrors = importJobErrors;
        LeadCommunications = leadCommunications;
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
