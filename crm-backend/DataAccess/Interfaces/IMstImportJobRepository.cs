using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstImportJobRepository : IRepository<MstImportJob>
{
    Task<IEnumerable<MstImportJob>> GetPendingJobsAsync();
}
