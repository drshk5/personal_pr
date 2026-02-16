using System;
using System.Threading.Tasks;
using AuditSoftware.Data;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Core;
using Microsoft.EntityFrameworkCore;

namespace AuditSoftware.Services
{
    public class ActivityLogService : IActivityLogService
    {
        private readonly AppDbContext _context;

        public ActivityLogService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogActivityAsync(
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
            string? userAgent = null)
        {
            var activityLog = new MstUserActivityLog
            {
                UserGUID = userGuid,
                GroupGUID = groupGuid,
                ActivityType = activityType,
                Details = details,
                OrganizationGUID = organizationGuid,
                YearGUID = yearGuid,
                ModuleGUID = moduleGuid,
                EntityType = entityType,
                EntityGUID = entityGuid,
                SessionID = sessionId,
                IPAddress = ipAddress,
                UserAgent = userAgent,
                CreatedByGUID = userGuid,
                CreatedOn = DateTime.UtcNow,
                ActivityTime = DateTime.UtcNow
            };

            await _context.MstUserActivityLogs.AddAsync(activityLog);
            await _context.SaveChangesAsync();
        }

        public async Task<MstUserActivityLog> GetActivityByIdAsync(Guid activityLogGuid)
        {
            return await _context.MstUserActivityLogs
                .FirstOrDefaultAsync(a => a.ActivityLogGUID == activityLogGuid);
        }
    }
}