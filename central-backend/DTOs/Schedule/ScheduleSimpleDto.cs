using System;

namespace AuditSoftware.DTOs.Schedule
{
    public class ScheduleSimpleDto
    {
        public Guid strScheduleGUID { get; set; }
        public string strScheduleCode { get; set; } = string.Empty;
        public string strScheduleName { get; set; } = string.Empty;
        public string strScheduleInfo { get; set; } = string.Empty;
    }
}
