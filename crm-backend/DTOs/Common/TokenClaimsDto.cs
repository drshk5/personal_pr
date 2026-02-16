namespace crm_backend.DTOs.Common;

public class TokenClaimsDto
{
    public Guid strUserGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strName { get; set; } = string.Empty;
    public string strEmailId { get; set; } = string.Empty;
    public string strTimeZone { get; set; } = "Asia/Kolkata";
}
