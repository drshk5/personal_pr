using crm_backend.DTOs.CustomerData;

namespace crm_backend.Interfaces;

public interface ILeadMergeService
{
    Task<LeadMergeResultDto> MergeLeadsAsync(LeadMergeRequestDto request);
}
