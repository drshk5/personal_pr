using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstContactRepository : IRepository<MstContact>
{
    Task<MstContact?> GetByEmailAsync(string email, Guid groupGuid);
    IQueryable<MstContact> QueryIncludingDeleted();
    Task AddRangeAsync(IEnumerable<MstContact> entities);
}
