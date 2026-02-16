using crm_backend.DTOs.Common;

namespace crm_backend.DTOs.CustomerData;

// --- IMPORT START ---
public class ImportStartDto
{
    public string strDuplicateHandling { get; set; } = "Skip"; // Skip, Update, Flag
    public Dictionary<string, string> ColumnMapping { get; set; } = new();
}

// --- SUGGEST MAPPING (empty — file comes from form) ---
public class ImportSuggestMappingDto
{
}

// --- SUGGEST MAPPING RESULT ---
public class ImportSuggestMappingResultDto
{
    public Dictionary<string, string> SuggestedMapping { get; set; } = new();
    public List<string> CsvHeaders { get; set; } = new();
    public List<string> AvailableLeadFields { get; set; } = new();
}

// --- IMPORT JOB LIST ---
public class ImportJobListDto
{
    public Guid strImportJobGUID { get; set; }
    public string strFileName { get; set; } = string.Empty;
    public string strStatus { get; set; } = string.Empty;
    public int intTotalRows { get; set; }
    public int intProcessedRows { get; set; }
    public int intSuccessRows { get; set; }
    public int intErrorRows { get; set; }
    public int intDuplicateRows { get; set; }
    public string strDuplicateHandling { get; set; } = string.Empty;
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtCompletedOn { get; set; }
}

// --- IMPORT JOB DETAIL ---
public class ImportJobDetailDto : ImportJobListDto
{
    public string strColumnMappingJson { get; set; } = string.Empty;
    public List<ImportJobErrorDto> Errors { get; set; } = new();
}

// --- IMPORT JOB ERROR ---
public class ImportJobErrorDto
{
    public Guid strImportJobErrorGUID { get; set; }
    public int intRowNumber { get; set; }
    public string? strRawData { get; set; }
    public string strErrorMessage { get; set; } = string.Empty;
    public string strErrorType { get; set; } = string.Empty;
}

// --- EXPORT REQUEST ---
public class ExportRequestDto
{
    public string? strStatus { get; set; }
    public string? strSource { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public DateTime? dtFromDate { get; set; }
    public DateTime? dtToDate { get; set; }
    public int? intMinScore { get; set; }
    public int? intMaxScore { get; set; }
    public List<string>? Columns { get; set; }
}

// --- IMPORT JOB FILTER PARAMS ---
public class ImportJobFilterParams : PagedRequestDto
{
    public string? strStatus { get; set; }
}
