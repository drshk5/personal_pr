using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DTOs.CustomerData;
using crm_backend.Exceptions;
using crm_backend.Interfaces;

namespace crm_backend.Services.CustomerData;

public class MstActivityService : ServiceBase, IActivityService
{
    public MstActivityService(
        ITenantContextProvider tenantContextProvider,
        ILogger<MstActivityService> logger)
        : base(tenantContextProvider, logger)
    {
    }

    public void ValidateActivityType(string activityType)
    {
        if (!ActivityTypeConstants.AllTypes.Contains(activityType))
            throw new ValidationException(
                $"Invalid activity type '{activityType}'. Must be one of: {string.Join(", ", ActivityTypeConstants.AllTypes)}");
    }

    public void ValidateEntityLinks(List<ActivityLinkDto> links)
    {
        foreach (var link in links)
        {
            if (!EntityTypeConstants.AllTypes.Contains(link.strEntityType))
                throw new ValidationException(
                    $"Invalid entity type '{link.strEntityType}'. Must be one of: {string.Join(", ", EntityTypeConstants.AllTypes)}");

            if (link.strEntityGUID == Guid.Empty)
                throw new ValidationException("Entity GUID cannot be empty");
        }
    }
}
