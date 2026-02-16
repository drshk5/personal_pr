using System;

namespace AuditSoftware.DTOs.RenameSchedule
{
    public class RenameScheduleUpdateDto
    {
        public string strRenameScheduleName { get; set; } = string.Empty;
        public Guid strScheduleGUID { get; set; }
    }
}