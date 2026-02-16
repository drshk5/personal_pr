namespace crm_backend.Models.Core.CustomerData;

public class MstActivityLink
{
    public Guid strActivityLinkGUID { get; set; }
    public Guid strActivityGUID { get; set; }
    public string strEntityType { get; set; } = string.Empty;
    public Guid strEntityGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }

    // Navigation
    public MstActivity Activity { get; set; } = null!;
}
