using System;

namespace AuditSoftware.DTOs.RenameSchedule
{
    public class RenameScheduleUpsertDto
    {
        public Guid strRenameScheduleGUID { get; set; }
        public string strRenameScheduleName { get; set; } = string.Empty;
        public Guid strScheduleGUID { get; set; }
    }
}