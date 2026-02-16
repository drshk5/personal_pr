using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstAccountRepository : IRepository<MstAccount>
{
    IQueryable<MstAccount> QueryIncludingDeleted();
}
