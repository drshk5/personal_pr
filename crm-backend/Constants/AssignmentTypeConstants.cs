namespace crm_backend.Constants;

public static class AssignmentTypeConstants
{
    public const string RoundRobin = "RoundRobin";
    public const string Territory = "Territory";
    public const string Capacity = "Capacity";
    public const string SkillBased = "SkillBased";

    public static readonly string[] AllTypes = { RoundRobin, Territory, Capacity, SkillBased };
}
