using System.Collections.Generic;

namespace AuditSoftware.DTOs.State
{
    public class ImportStateResultDto
    {
        public int TotalRows { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<string> ErrorMessages { get; set; } = new List<string>();
        public List<string> MissingCountries { get; set; } = new List<string>();
    }
}
