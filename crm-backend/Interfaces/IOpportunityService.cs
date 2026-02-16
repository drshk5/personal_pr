using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Interfaces;

public interface IOpportunityService
{
    void ValidateOpportunityName(string name);
    void ValidateCloseRequest(string currentStatus, CloseOpportunityDto dto);
    void ValidateStageTransition(MstPipelineStage currentStage, MstPipelineStage targetStage);
    void ValidateForDeletion(MstOpportunity opportunity);
}
