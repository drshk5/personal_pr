using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DTOs.CustomerData;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Services.CustomerData;

public class MstPipelineService : ServiceBase, IPipelineService
{
    public MstPipelineService(
        ITenantContextProvider tenantContextProvider,
        ILogger<MstPipelineService> logger)
        : base(tenantContextProvider, logger)
    {
    }

    public void ValidatePipelineName(string pipelineName)
    {
        if (string.IsNullOrWhiteSpace(pipelineName))
        {
            throw new BusinessException("Pipeline name is required", PipelineConstants.ErrorCodes.RequiredFieldsMissing);
        }

        if (pipelineName.Trim().Length > 200)
        {
            throw new BusinessException("Pipeline name must not exceed 200 characters", PipelineConstants.ErrorCodes.PipelineNameTooLong);
        }
    }

    public void ValidateForDeletion(MstPipeline pipeline, int opportunityCount)
    {
        if (pipeline.bolIsDefault)
        {
            throw new BusinessException(
                "Cannot delete the default pipeline. Please set another pipeline as default first.",
                PipelineConstants.ErrorCodes.CannotDeleteDefault);
        }

        if (opportunityCount > 0)
        {
            throw new BusinessException(
                $"Cannot delete pipeline with {opportunityCount} associated opportunity(ies). Reassign or close opportunities first.",
                PipelineConstants.ErrorCodes.PipelineHasOpportunities);
        }
    }

    public void ValidateStageOrder(List<CreatePipelineStageDto> stages)
    {
        if (stages == null || !stages.Any())
        {
            throw new BusinessException("Pipeline must have at least one stage", PipelineConstants.ErrorCodes.RequiredFieldsMissing);
        }

        if (stages.Count < 2)
        {
            throw new BusinessException("Pipeline must have at least 2 stages", PipelineConstants.ErrorCodes.RequiredFieldsMissing);
        }

        // Check for exactly one Won stage
        var wonStagesCount = stages.Count(s => s.bolIsWonStage);
        if (wonStagesCount != 1)
        {
            throw new BusinessException("Pipeline must have exactly one Won stage", PipelineConstants.ErrorCodes.InvalidStageConfiguration);
        }

        // Check for exactly one Lost stage
        var lostStagesCount = stages.Count(s => s.bolIsLostStage);
        if (lostStagesCount != 1)
        {
            throw new BusinessException("Pipeline must have exactly one Lost stage", PipelineConstants.ErrorCodes.InvalidStageConfiguration);
        }

        // Check for duplicate stage names
        var duplicateStages = stages.GroupBy(s => s.strStageName.Trim().ToLower())
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (duplicateStages.Any())
        {
            throw new BusinessException(
                $"Duplicate stage names found: {string.Join(", ", duplicateStages)}",
                PipelineConstants.ErrorCodes.DuplicateStageNames);
        }

        // Validate display order sequence
        var orderedStages = stages.OrderBy(s => s.intDisplayOrder).ToList();
        for (int i = 0; i < orderedStages.Count; i++)
        {
            if (orderedStages[i].intDisplayOrder != i + 1)
            {
                throw new BusinessException(
                    "Stage display order must be sequential starting from 1",
                    PipelineConstants.ErrorCodes.InvalidStageOrder);
            }
        }

        // Validate probability percentages
        foreach (var stage in stages)
        {
            if (stage.intProbabilityPercent < 0 || stage.intProbabilityPercent > 100)
            {
                throw new BusinessException(
                    $"Stage '{stage.strStageName}' has invalid probability percentage. Must be between 0 and 100.",
                    PipelineConstants.ErrorCodes.InvalidProbability);
            }
        }

        // Won stage should have 100% probability
        var wonStage = stages.FirstOrDefault(s => s.bolIsWonStage);
        if (wonStage != null && wonStage.intProbabilityPercent != 100)
        {
            throw new BusinessException(
                "Won stage must have 100% probability",
                PipelineConstants.ErrorCodes.InvalidProbability);
        }

        // Lost stage should have 0% probability
        var lostStage = stages.FirstOrDefault(s => s.bolIsLostStage);
        if (lostStage != null && lostStage.intProbabilityPercent != 0)
        {
            throw new BusinessException(
                "Lost stage must have 0% probability",
                PipelineConstants.ErrorCodes.InvalidProbability);
        }
    }

    public void ValidateDefaultPipeline(bool isDefault, bool isCurrentDefault)
    {
        // This validation is used when updating a pipeline
        // If trying to remove default status from the only default pipeline
        if (!isDefault && isCurrentDefault)
        {
            throw new BusinessException(
                "Cannot remove default status. At least one pipeline must be set as default.",
                PipelineConstants.ErrorCodes.MustHaveDefault);
        }
    }
}
