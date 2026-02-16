using System;
using System.Threading.Tasks;
using AuditSoftware.Data;
using AuditSoftware.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AuditSoftware.Services
{
    public class ConnectionStringResolver : IConnectionStringResolver
    {
        private readonly AppDbContext _context;
        private readonly IDistributedCache _cache;
        private readonly ILogger<ConnectionStringResolver> _logger;
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);

        public ConnectionStringResolver(AppDbContext context, IDistributedCache cache, ILogger<ConnectionStringResolver> logger)
        {
            _context = context;
            _cache = cache;
            _logger = logger;
        }

        public async Task<string?> GetConnectionStringAsync(Guid groupGuid, Guid moduleGuid)
        {
            if (groupGuid == Guid.Empty || moduleGuid == Guid.Empty)
            {
                _logger.LogWarning("Connection string lookup missing required GUIDs. Group: {GroupGuid}, Module: {ModuleGuid}", groupGuid, moduleGuid);
                return null;
            }

            string cacheKey = $"conn:{groupGuid}:{moduleGuid}";

            // Try cache first
            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached))
            {
                return cached;
            }

            // Query database
            var groupModule = await _context.MstGroupModules
                .AsNoTracking()
                .FirstOrDefaultAsync(gm => gm.strGroupGUID == groupGuid && gm.strModuleGUID == moduleGuid);

            if (groupModule?.strConnectionString == null)
            {
                _logger.LogWarning("No connection string found for Group {GroupGuid} and Module {ModuleGuid}", groupGuid, moduleGuid);
                return null;
            }

            // Cache the result
            await _cache.SetStringAsync(cacheKey, groupModule.strConnectionString, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = CacheDuration
            });

            return groupModule.strConnectionString;
        }
    }
}
