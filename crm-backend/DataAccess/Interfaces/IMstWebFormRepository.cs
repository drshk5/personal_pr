using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstWebFormRepository : IRepository<MstWebForm>
{
    Task<MstWebForm?> GetByIdWithFieldsAsync(Guid formGuid);
}
