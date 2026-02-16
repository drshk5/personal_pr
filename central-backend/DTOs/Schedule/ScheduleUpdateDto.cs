using System;

namespace AuditSoftware.DTOs.Schedule
{
    public class ScheduleUpdateDto
    {
        public int code { get; set; }
        public string strScheduleCode { get; set; } = string.Empty;
        public string? strRefNo { get; set; }
        public string strScheduleName { get; set; } = string.Empty;
        public string? strTemplateName { get; set; } // Corrected from strRemplateName to match database
        public string? strUnderCode { get; set; }
        public Guid? strParentScheduleGUID { get; set; }
        public double? dblChartType { get; set; }
        public Guid? strDefaultAccountTypeGUID { get; set; }
        public bool bolIsActive { get; set; }
        public bool bolIsEditable { get; set; }
    }
}
