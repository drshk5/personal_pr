using System;
using System.Threading.Tasks;

namespace crm_backend.Interfaces
{
    public interface IConnectionStringResolver
    {
        Task<string?> GetConnectionStringAsync(Guid groupGuid, Guid moduleGuid);
        Task<string?> GetCrmConnectionStringByGroupAsync(Guid groupGuid);
    }
}
