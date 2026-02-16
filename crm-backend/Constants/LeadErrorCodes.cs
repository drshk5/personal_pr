namespace crm_backend.Constants;

public static class LeadErrorCodes
{
    public const string LeadNotFound = "LEAD_NOT_FOUND";
    public const string LeadAlreadyConverted = "LEAD_ALREADY_CONVERTED";
    public const string LeadNotQualified = "LEAD_NOT_QUALIFIED";
    public const string DuplicateEmail = "LEAD_DUPLICATE_EMAIL";
    public const string InvalidStatusTransition = "LEAD_INVALID_STATUS";
    public const string MergeFailed = "LEAD_MERGE_FAILED";
    public const string AssignmentFailed = "LEAD_ASSIGNMENT_FAILED";
    public const string ImportFailed = "LEAD_IMPORT_FAILED";
    public const string WebFormNotFound = "LEAD_WEBFORM_NOT_FOUND";
    public const string WebFormInactive = "LEAD_WEBFORM_INACTIVE";
    public const string DuplicateDetected = "LEAD_DUPLICATE_DETECTED";
}
