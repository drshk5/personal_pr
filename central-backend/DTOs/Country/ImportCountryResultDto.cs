using System.Collections.Generic;

namespace AuditSoftware.DTOs.Country
{
    public class ImportCountryResultDto
    {
        public int TotalRows { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<string> ErrorMessages { get; set; } = new List<string>();
    }
}
