using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstWebFormFieldRepository : IRepository<MstWebFormField>
{
    Task<IEnumerable<MstWebFormField>> GetByFormIdAsync(Guid formGuid);
}
