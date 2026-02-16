using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstLeadCommunicationRepository : IRepository<MstLeadCommunication>
{
    Task<IEnumerable<MstLeadCommunication>> GetByLeadIdAsync(Guid leadGuid);
    Task<MstLeadCommunication?> GetByTrackingPixelAsync(Guid trackingPixelGuid);
}
