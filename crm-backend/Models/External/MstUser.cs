namespace crm_backend.Models.External;

public class MstUser
{
    public Guid strUserGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strName { get; set; } = string.Empty;
    public string strEmailId { get; set; } = string.Empty;
}
