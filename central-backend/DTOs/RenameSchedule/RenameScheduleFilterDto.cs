using AuditSoftware.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.RenameSchedule
{
    public class RenameScheduleFilterDto
    {
        [FromQuery(Name = "search")]
        public string? Search { get; set; }
    }
}