using System.Collections.Generic;

namespace AuditSoftware.DTOs.Schedule
{
    public class ImportScheduleResultDto
    {
        public int TotalRows { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<string> ErrorMessages { get; set; } = new List<string>();
        public List<string> DuplicateSchedules { get; set; } = new List<string>();
    }
}
