using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Interfaces;

public interface ICommunicationService
{
    Task TrackEmailOpenAsync(Guid trackingPixelGuid);
    Task IncrementClickCountAsync(Guid communicationGuid);
}
