using System;
using System.Collections.Generic;

namespace AuditSoftware.DTOs.Schedule
{
    public class ScheduleImportResponseDto
    {
        public int TotalRecords { get; set; }
        public int ImportedRecords { get; set; }
        public int FailedRecords { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public bool Success => FailedRecords == 0;
    }
}
