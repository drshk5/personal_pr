namespace crm_backend.Constants;

public static class WorkflowActionConstants
{
    public const string CreateTask = "CreateTask";
    public const string SendNotification = "SendNotification";
    public const string ChangeStatus = "ChangeStatus";
    public const string Archive = "Archive";
    public const string AssignActivity = "AssignActivity";
    public const string UpdateEntityStatus = "UpdateEntityStatus";
    public const string CreateFollowUp = "CreateFollowUp";

    public static readonly string[] AllActions = { CreateTask, SendNotification, ChangeStatus, Archive, AssignActivity, UpdateEntityStatus, CreateFollowUp };
}

