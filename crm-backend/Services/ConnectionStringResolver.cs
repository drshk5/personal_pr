using System;
using System.Threading.Tasks;
using crm_backend.Data;
using crm_backend.Interfaces;
using crm_backend.Models.External;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace crm_backend.Services
{
    public class ConnectionStringResolver : IConnectionStringResolver
    {
        private readonly MasterDbContext _masterDbContext;
        private readonly IMemoryCache _cache;
        private readonly ILogger<ConnectionStringResolver> _logger;
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);

        public ConnectionStringResolver(
            MasterDbContext masterDbContext,
            IMemoryCache cache,
            ILogger<ConnectionStringResolver> logger)
        {
            _masterDbContext = masterDbContext;
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

            var cacheKey = $"conn:{groupGuid}:{moduleGuid}";
            if (_cache.TryGetValue(cacheKey, out string? cachedConnection))
            {
                _logger.LogInformation("Connection string found in cache for Group {GroupGuid} and Module {ModuleGuid}", groupGuid, moduleGuid);
                return cachedConnection;
            }

            _logger.LogInformation("Querying MstGroupModule for Group {GroupGuid} and Module {ModuleGuid}", groupGuid, moduleGuid);

            var groupModule = await _masterDbContext.Set<MstGroupModule>()
                .AsNoTracking()
                .FirstOrDefaultAsync(gm => gm.strGroupGUID == groupGuid && gm.strModuleGUID == moduleGuid);

            if (groupModule == null)
            {
                _logger.LogWarning("No MstGroupModule record found for Group {GroupGuid} and Module {ModuleGuid}", groupGuid, moduleGuid);
                return null;
            }

            if (string.IsNullOrEmpty(groupModule.strConnectionString))
            {
                _logger.LogWarning("MstGroupModule found but connection string is null or empty for Group {GroupGuid} and Module {ModuleGuid}", groupGuid, moduleGuid);
                return null;
            }

            _logger.LogInformation("Successfully retrieved connection string from MstGroupModule for Group {GroupGuid} and Module {ModuleGuid}", groupGuid, moduleGuid);

            _cache.Set(cacheKey, groupModule.strConnectionString, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = CacheDuration
            });

            return groupModule.strConnectionString;
        }

        public async Task<string?> GetCrmConnectionStringByGroupAsync(Guid groupGuid)
        {
            if (groupGuid == Guid.Empty)
            {
                _logger.LogWarning("CRM connection string lookup missing Group GUID");
                return null;
            }

            var cacheKey = $"conn:crm:{groupGuid}";
            if (_cache.TryGetValue(cacheKey, out string? cachedConnection))
            {
                _logger.LogInformation("CRM connection string found in cache for Group {GroupGuid}", groupGuid);
                return cachedConnection;
            }

            _logger.LogInformation("Querying MstGroupModule for CRM connection string by Group {GroupGuid}", groupGuid);

            var groupModule = await _masterDbContext.Set<MstGroupModule>()
                .AsNoTracking()
                .Where(gm => gm.strGroupGUID == groupGuid
                             && !string.IsNullOrEmpty(gm.strConnectionString)
                             && (EF.Functions.Like(gm.strConnectionString, "%Initial Catalog=CRM_%")
                                 || EF.Functions.Like(gm.strConnectionString, "%Database=CRM_%")))
                .OrderByDescending(gm => gm.dtCreatedOn)
                .FirstOrDefaultAsync();

            if (groupModule == null || string.IsNullOrEmpty(groupModule.strConnectionString))
            {
                _logger.LogWarning("No CRM connection string found in MstGroupModule for Group {GroupGuid}", groupGuid);
                return null;
            }

            _cache.Set(cacheKey, groupModule.strConnectionString, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = CacheDuration
            });

            _logger.LogInformation("Successfully retrieved CRM connection string for Group {GroupGuid}", groupGuid);
            return groupModule.strConnectionString;
        }
    }
}
