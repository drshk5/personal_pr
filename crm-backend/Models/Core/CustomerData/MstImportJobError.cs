using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstImportJobError : ITenantEntity
{
    public Guid strImportJobErrorGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public Guid strImportJobGUID { get; set; }
    public int intRowNumber { get; set; }
    public string? strRawDataJson { get; set; }
    public string strErrorMessage { get; set; } = string.Empty;
    public string strErrorType { get; set; } = string.Empty; // Validation, Duplicate, System
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;

    // Navigation
    public MstImportJob? ImportJob { get; set; }
}
