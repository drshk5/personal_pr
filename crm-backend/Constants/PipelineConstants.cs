namespace crm_backend.Constants;

public static class PipelineConstants
{
    public const string DefaultPipelineName = "Sales Pipeline";
    public const int MaxStagesPerPipeline = 20;
    public const int MinStagesPerPipeline = 2;

    public static class ErrorCodes
    {
        public const string RequiredFieldsMissing = "PIPELINE_REQUIRED_FIELDS_MISSING";
        public const string PipelineNameTooLong = "PIPELINE_NAME_TOO_LONG";
        public const string CannotDeleteDefault = "PIPELINE_CANNOT_DELETE_DEFAULT";
        public const string PipelineHasOpportunities = "PIPELINE_HAS_OPPORTUNITIES";
        public const string InvalidStageConfiguration = "PIPELINE_INVALID_STAGE_CONFIG";
        public const string DuplicateStageNames = "PIPELINE_DUPLICATE_STAGE_NAMES";
        public const string InvalidStageOrder = "PIPELINE_INVALID_STAGE_ORDER";
        public const string InvalidProbability = "PIPELINE_INVALID_PROBABILITY";
        public const string MustHaveDefault = "PIPELINE_MUST_HAVE_DEFAULT";
        public const string PipelineNotFound = "PIPELINE_NOT_FOUND";
        public const string StageNotFound = "PIPELINE_STAGE_NOT_FOUND";
    }
}
