using System;
using System.Threading.Tasks;
using AuditSoftware.Models.Core;

namespace AuditSoftware.Interfaces
{
    public interface IActivityLogService
    {
        Task LogActivityAsync(
            Guid userGuid,
            Guid groupGuid,
            string activityType,
            string details,
            Guid? organizationGuid = null,
            Guid? yearGuid = null,
            Guid? moduleGuid = null,
            string? entityType = null,
            Guid? entityGuid = null,
            string? sessionId = null,
            string? ipAddress = null,
            string? userAgent = null);

        Task<MstUserActivityLog> GetActivityByIdAsync(Guid activityLogGuid);
    }
}