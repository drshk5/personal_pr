using System;

namespace AuditSoftware.DTOs.RenameSchedule
{
    public class RenameScheduleCreateDto
    {
        public string strRenameScheduleName { get; set; } = string.Empty;
        public Guid strScheduleGUID { get; set; }
    }
}