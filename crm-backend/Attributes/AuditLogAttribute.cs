namespace crm_backend.Attributes;

[AttributeUsage(AttributeTargets.Method)]
public class AuditLogAttribute : Attribute
{
    public string EntityType { get; }
    public string Action { get; }

    public AuditLogAttribute(string entityType, string action)
    {
        EntityType = entityType;
        Action = action;
    }
}
