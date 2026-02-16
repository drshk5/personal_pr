namespace crm_backend.Constants;

public static class ActivityTypeConstants
{
    public const string Call = "Call";
    public const string Email = "Email";
    public const string Meeting = "Meeting";
    public const string Note = "Note";
    public const string Task = "Task";
    public const string FollowUp = "FollowUp";

    public static readonly string[] AllTypes = { Call, Email, Meeting, Note, Task, FollowUp };
}
