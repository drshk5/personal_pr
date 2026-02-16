using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstPipelineApplicationService : IApplicationService
{
    Task<List<PipelineListDto>> GetPipelinesAsync();
    Task<PipelineDetailDto> GetPipelineByIdAsync(Guid id);
    Task<PipelineDetailDto> CreatePipelineAsync(CreatePipelineDto dto);
    Task<PipelineDetailDto> UpdatePipelineAsync(Guid id, CreatePipelineDto dto);
    Task<bool> DeletePipelineAsync(Guid id);
    Task<PipelineDetailDto> SetDefaultPipelineAsync(Guid id);
}
