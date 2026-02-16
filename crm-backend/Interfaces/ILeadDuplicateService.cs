using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Interfaces;

public interface ILeadDuplicateService
{
    Task<List<DuplicatePairDto>> CheckForDuplicatesAsync(MstLead lead);
    Task ResolveDuplicateAsync(Guid duplicateGuid, string status);
}
