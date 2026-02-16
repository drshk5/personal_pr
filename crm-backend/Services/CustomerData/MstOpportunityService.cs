using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DTOs.CustomerData;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Services.CustomerData;

public class MstOpportunityService : ServiceBase, IOpportunityService
{
    public MstOpportunityService(
        ITenantContextProvider tenantContextProvider,
        ILogger<MstOpportunityService> logger)
        : base(tenantContextProvider, logger)
    {
    }

    public void ValidateOpportunityName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessException("Opportunity name is required", OpportunityErrorCodes.RequiredFieldsMissing);

        if (name.Trim().Length > 200)
            throw new BusinessException("Opportunity name must not exceed 200 characters", OpportunityErrorCodes.RequiredFieldsMissing);
    }

    public void ValidateCloseRequest(string currentStatus, CloseOpportunityDto dto)
    {
        if (currentStatus != "Open")
            throw new BusinessException("Only open opportunities can be closed", OpportunityErrorCodes.AlreadyClosed);

        if (dto.strStatus != "Won" && dto.strStatus != "Lost")
            throw new BusinessException("Status must be 'Won' or 'Lost'", OpportunityErrorCodes.RequiredFieldsMissing);

        if (dto.strStatus == "Lost" && string.IsNullOrWhiteSpace(dto.strLossReason))
            throw new BusinessException("Loss reason is required when closing as Lost", OpportunityErrorCodes.LossReasonRequired);
    }

    public void ValidateStageTransition(MstPipelineStage currentStage, MstPipelineStage targetStage)
    {
        if (currentStage.strPipelineGUID != targetStage.strPipelineGUID)
            throw new BusinessException("Cannot move to a stage in a different pipeline", OpportunityErrorCodes.InvalidStageTransition);

        if (currentStage.bolIsWonStage || currentStage.bolIsLostStage)
            throw new BusinessException("Cannot move from a closed stage", OpportunityErrorCodes.InvalidStageTransition);
    }

    public void ValidateForDeletion(MstOpportunity opportunity)
    {
        if (opportunity.strStatus == "Won")
            throw new BusinessException("Cannot delete a won opportunity", OpportunityErrorCodes.AlreadyClosed);
    }
}
