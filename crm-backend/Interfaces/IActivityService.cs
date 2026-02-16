using crm_backend.DTOs.CustomerData;

namespace crm_backend.Interfaces;

public interface IActivityService
{
    void ValidateActivityType(string activityType);
    void ValidateEntityLinks(List<ActivityLinkDto> links);
}
