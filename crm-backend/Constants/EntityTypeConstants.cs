namespace crm_backend.Constants;

public static class EntityTypeConstants
{
    public const string Lead = "Lead";
    public const string Contact = "Contact";
    public const string Account = "Account";
    public const string Opportunity = "Opportunity";
    public const string Pipeline = "Pipeline";
    public const string ScoringRule = "ScoringRule";
    public const string AssignmentRule = "AssignmentRule";
    public const string WorkflowRule = "WorkflowRule";
    public const string WebForm = "WebForm";
    public const string ImportJob = "ImportJob";
    public const string Communication = "Communication";
    public const string LeadDuplicate = "LeadDuplicate";

    public static readonly string[] AllTypes = { Lead, Contact, Account, Opportunity, Pipeline, ScoringRule, AssignmentRule, WorkflowRule, WebForm, ImportJob, Communication, LeadDuplicate };
}
