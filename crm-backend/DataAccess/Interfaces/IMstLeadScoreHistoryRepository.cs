using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstLeadScoreHistoryRepository : IRepository<MstLeadScoreHistory>
{
    Task<IEnumerable<MstLeadScoreHistory>> GetByLeadIdAsync(Guid leadGuid);
}
