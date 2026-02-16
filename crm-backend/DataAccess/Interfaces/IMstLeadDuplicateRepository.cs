using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstLeadDuplicateRepository : IRepository<MstLeadDuplicate>
{
    Task<IEnumerable<MstLeadDuplicate>> GetPendingSuggestionsAsync();
    Task<IEnumerable<MstLeadDuplicate>> GetByLeadIdAsync(Guid leadGuid);
}
