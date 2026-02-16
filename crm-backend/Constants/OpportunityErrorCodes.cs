namespace crm_backend.Constants;

public static class OpportunityErrorCodes
{
    public const string OpportunityNotFound = "OPP_NOT_FOUND";
    public const string InvalidStageTransition = "OPP_INVALID_STAGE";
    public const string RequiredFieldsMissing = "OPP_REQUIRED_FIELDS";
    public const string AlreadyClosed = "OPP_ALREADY_CLOSED";
    public const string LossReasonRequired = "OPP_LOSS_REASON_REQUIRED";
}
