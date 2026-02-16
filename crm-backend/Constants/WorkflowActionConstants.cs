namespace crm_backend.Constants;

public static class WorkflowActionConstants
{
    public const string CreateTask = "CreateTask";
    public const string SendNotification = "SendNotification";
    public const string ChangeStatus = "ChangeStatus";
    public const string Archive = "Archive";

    public static readonly string[] AllActions = { CreateTask, SendNotification, ChangeStatus, Archive };
}
