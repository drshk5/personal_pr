using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstLeadRepository : IRepository<MstLead>
{
    Task<MstLead?> GetByEmailAsync(string email, Guid groupGuid);
    Task<IEnumerable<MstLead>> GetByStatusAsync(string status);
    IQueryable<MstLead> QueryIncludingDeleted();
}
