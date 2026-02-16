using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstActivityLinkRepository : IRepository<MstActivityLink>
{
    Task<IEnumerable<MstActivityLink>> GetByEntityAsync(string entityType, Guid entityGuid);
}
