using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Interfaces;

public interface IPipelineService
{
    void ValidatePipelineName(string pipelineName);
    void ValidateForDeletion(MstPipeline pipeline, int opportunityCount);
    void ValidateStageOrder(List<CreatePipelineStageDto> stages);
    void ValidateDefaultPipeline(bool isDefault, bool isCurrentDefault);
}
