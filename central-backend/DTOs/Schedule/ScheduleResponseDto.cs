using System;

namespace AuditSoftware.DTOs.Schedule
{
    public class ScheduleResponseDto
    {
        public Guid strScheduleGUID { get; set; }
        public int code { get; set; }
        public string strScheduleCode { get; set; } = string.Empty;
        public string? strRefNo { get; set; }
        public string strScheduleName { get; set; } = string.Empty;
        public string? strTemplateName { get; set; } // Corrected from strRemplateName to match database
        public string? strUnderCode { get; set; }
        public Guid? strParentScheduleGUID { get; set; }
        public string? strParentScheduleName { get; set; } // Added parent schedule name
        public double? dblChartType { get; set; }
        public Guid? strDefaultAccountTypeGUID { get; set; }
        public string? strAccountTypeName { get; set; } // Added account type name
        public bool bolIsActive { get; set; }
        public bool bolIsEditable { get; set; }
        // Audit fields removed as they're not in the actual database schema
    }
}
