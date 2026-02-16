using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstImportJob : ITenantEntity
{
    public Guid strImportJobGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strFileName { get; set; } = string.Empty;
    public string strStatus { get; set; } = "Pending"; // Pending, Processing, Completed, Failed
    public int intTotalRows { get; set; }
    public int intProcessedRows { get; set; }
    public int intSuccessRows { get; set; }
    public int intErrorRows { get; set; }
    public int intDuplicateRows { get; set; }
    public string strDuplicateHandling { get; set; } = "Skip"; // Skip, Update, Flag
    public string strColumnMappingJson { get; set; } = string.Empty;
    public Guid strCreatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;
    public DateTime? dtCompletedOn { get; set; }

    // Navigation
    public ICollection<MstImportJobError> Errors { get; set; } = new List<MstImportJobError>();
}
