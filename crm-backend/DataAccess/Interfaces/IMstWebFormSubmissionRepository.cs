using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstWebFormSubmissionRepository : IRepository<MstWebFormSubmission>
{
    Task<IEnumerable<MstWebFormSubmission>> GetByFormIdAsync(Guid formGuid);
}
