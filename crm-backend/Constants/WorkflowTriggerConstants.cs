namespace crm_backend.Constants;

public static class WorkflowTriggerConstants
{
    public const string StatusChanged = "StatusChanged";
    public const string Created = "Created";
    public const string ScoreChanged = "ScoreChanged";
    public const string Aging = "Aging";
    public const string ActivityCompleted = "ActivityCompleted";
    public const string ActivityCreated = "ActivityCreated";
    public const string Assigned = "Assigned";

    public static readonly string[] AllTriggers = { StatusChanged, Created, ScoreChanged, Aging, ActivityCompleted, ActivityCreated, Assigned };
}

