using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstImportJobErrorRepository : IRepository<MstImportJobError>
{
    Task<IEnumerable<MstImportJobError>> GetByJobIdAsync(Guid jobGuid);
}
