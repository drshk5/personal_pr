using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Helpers;

public static class ActivityDtoEnricher
{
    public static async Task PopulateUserNamesAsync(
        MasterDbContext masterDbContext,
        Guid tenantId,
        List<ActivityListDto> activities)
    {
        if (activities.Count == 0)
            return;

        // Collect distinct user IDs referenced by the activities.
        var userIds = activities
            .Select(a => a.strCreatedByGUID)
            .Concat(activities.Where(a => a.strAssignedToGUID.HasValue)
                .Select(a => a.strAssignedToGUID!.Value))
            .Distinct()
            .ToList();

        if (userIds.Count == 0)
            return;

        var users = await masterDbContext.MstUsers
            .AsNoTracking()
            .Where(u => u.strGroupGUID == tenantId && userIds.Contains(u.strUserGUID))
            .Select(u => new { u.strUserGUID, u.strName })
            .ToListAsync();

        var nameById = users.ToDictionary(u => u.strUserGUID, u => u.strName);

        foreach (var a in activities)
        {
            if (nameById.TryGetValue(a.strCreatedByGUID, out var createdName))
                a.strCreatedByName = createdName;

            if (a.strAssignedToGUID.HasValue
                && nameById.TryGetValue(a.strAssignedToGUID.Value, out var assignedName))
            {
                a.strAssignedToName = assignedName;
            }
        }
    }
}

