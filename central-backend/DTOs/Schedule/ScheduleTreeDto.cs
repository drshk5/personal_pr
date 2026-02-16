using System;
using System.Collections.Generic;

namespace AuditSoftware.DTOs.Schedule
{
    public class ScheduleTreeDto
    {
        public Guid strScheduleGUID { get; set; }
        public string strScheduleCode { get; set; } = string.Empty;
        public string strScheduleName { get; set; } = string.Empty;
        public string strScheduleInfo { get; set; } = string.Empty;
        public string type { get; set; } = "data";  // Default to "data", will be set to "label" if it has children
        public List<ScheduleTreeDto> Children { get; set; } = new List<ScheduleTreeDto>();
    }
}