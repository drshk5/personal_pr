using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstWebForm : ITenantEntity
{
    public Guid strWebFormGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strFormName { get; set; } = string.Empty;
    public string? strFormDescription { get; set; }
    public string? strRedirectUrl { get; set; }
    public string? strThankYouMessage { get; set; }
    public string strDefaultSource { get; set; } = "Website";
    public Guid? strDefaultAssignedToGUID { get; set; }
    public string? strCustomCss { get; set; }
    public bool bolIsActive { get; set; } = true;
    public bool bolIsDeleted { get; set; }
    public bool bolCaptchaEnabled { get; set; } = true;
    public Guid strCreatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime? dtUpdatedOn { get; set; }

    // Navigation
    public ICollection<MstWebFormField> Fields { get; set; } = new List<MstWebFormField>();
    public ICollection<MstWebFormSubmission> Submissions { get; set; } = new List<MstWebFormSubmission>();
}
