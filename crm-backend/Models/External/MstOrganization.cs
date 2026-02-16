namespace crm_backend.Models.External;

public class MstOrganization
{
    public Guid strOrganizationGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strName { get; set; } = string.Empty;
}
