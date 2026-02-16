using Microsoft.EntityFrameworkCore;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.CustomerData;

public class MstPipelineApplicationService : ApplicationServiceBase, IMstPipelineApplicationService
{
    private readonly IPipelineService _pipelineService;

    public MstPipelineApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        IPipelineService pipelineService,
        ILogger<MstPipelineApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _pipelineService = pipelineService;
    }

    // ────────────────────────────────────────────────────────────────
    // GET LIST — All pipelines with stage count and opportunity count
    // ────────────────────────────────────────────────────────────────

    public async Task<List<PipelineListDto>> GetPipelinesAsync()
    {
        var pipelines = await _unitOfWork.Pipelines.Query()
            .AsNoTracking()
            .Include(p => p.Stages)
            .Include(p => p.Opportunities)
            .Where(p => p.bolIsActive)
            .OrderByDescending(p => p.bolIsDefault)
            .ThenBy(p => p.strPipelineName)
            .Select(p => new PipelineListDto
            {
                strPipelineGUID = p.strPipelineGUID,
                strPipelineName = p.strPipelineName,
                strDescription = p.strDescription,
                bolIsDefault = p.bolIsDefault,
                intStageCount = p.Stages.Count(s => s.bolIsActive),
                intOpportunityCount = p.Opportunities.Count(o => o.bolIsActive && !o.bolIsDeleted),
                bolIsActive = p.bolIsActive
            })
            .ToListAsync();

        return pipelines;
    }

    // ────────────────────────────────────────────────────────────────
    // GET BY ID — Pipeline with all stages
    // ────────────────────────────────────────────────────────────────

    public async Task<PipelineDetailDto> GetPipelineByIdAsync(Guid id)
    {
        var pipeline = await _unitOfWork.Pipelines.Query()
            .AsNoTracking()
            .Include(p => p.Stages)
            .Include(p => p.Opportunities)
            .Where(p => p.strPipelineGUID == id)
            .FirstOrDefaultAsync();

        if (pipeline == null)
            throw new NotFoundException("Pipeline not found", PipelineConstants.ErrorCodes.PipelineNotFound);

        var pipelineDto = new PipelineDetailDto
        {
            strPipelineGUID = pipeline.strPipelineGUID,
            strPipelineName = pipeline.strPipelineName,
            strDescription = pipeline.strDescription,
            bolIsDefault = pipeline.bolIsDefault,
            intStageCount = pipeline.Stages.Count(s => s.bolIsActive),
            intOpportunityCount = pipeline.Opportunities.Count(o => o.bolIsActive && !o.bolIsDeleted),
            bolIsActive = pipeline.bolIsActive,
            Stages = pipeline.Stages
                .Where(s => s.bolIsActive)
                .OrderBy(s => s.intDisplayOrder)
                .Select(s => new PipelineStageDto
                {
                    strStageGUID = s.strStageGUID,
                    strStageName = s.strStageName,
                    intDisplayOrder = s.intDisplayOrder,
                    intProbabilityPercent = s.intProbabilityPercent,
                    intDefaultDaysToRot = s.intDefaultDaysToRot,
                    bolIsWonStage = s.bolIsWonStage,
                    bolIsLostStage = s.bolIsLostStage,
                    intOpportunityCount = pipeline.Opportunities.Count(o =>
                        o.strStageGUID == s.strStageGUID &&
                        o.bolIsActive &&
                        !o.bolIsDeleted)
                })
                .ToList()
        };

        return pipelineDto;
    }

    // ────────────────────────────────────────────────────────────────
    // CREATE — Pipeline with stages (atomic transaction)
    // ────────────────────────────────────────────────────────────────

    public async Task<PipelineDetailDto> CreatePipelineAsync(CreatePipelineDto dto)
    {
        // Validate
        _pipelineService.ValidatePipelineName(dto.strPipelineName);
        _pipelineService.ValidateStageOrder(dto.Stages);

        var now = DateTime.UtcNow;
        var userGUID = GetCurrentUserId();

        // If this is marked as default, unset other defaults
        if (dto.bolIsDefault)
        {
            var existingDefaults = await _unitOfWork.Pipelines.Query()
                .Where(p => p.bolIsDefault)
                .ToListAsync();

            foreach (var existing in existingDefaults)
            {
                existing.bolIsDefault = false;
                existing.dtUpdatedOn = now;
                existing.strUpdatedByGUID = userGUID;
                _unitOfWork.Pipelines.Update(existing);
            }
        }

        // Create pipeline
        var pipeline = new MstPipeline
        {
            strPipelineGUID = Guid.NewGuid(),
            strGroupGUID = GetTenantId(),
            strPipelineName = dto.strPipelineName.Trim(),
            strDescription = dto.strDescription?.Trim(),
            bolIsDefault = dto.bolIsDefault,
            strCreatedByGUID = userGUID,
            dtCreatedOn = now,
            bolIsActive = true,
            bolIsDeleted = false
        };

        // Create stages
        foreach (var stageDto in dto.Stages.OrderBy(s => s.intDisplayOrder))
        {
            var stage = new MstPipelineStage
            {
                strStageGUID = Guid.NewGuid(),
                strPipelineGUID = pipeline.strPipelineGUID,
                strStageName = stageDto.strStageName.Trim(),
                intDisplayOrder = stageDto.intDisplayOrder,
                intProbabilityPercent = stageDto.intProbabilityPercent,
                intDefaultDaysToRot = stageDto.intDefaultDaysToRot,
                bolIsWonStage = stageDto.bolIsWonStage,
                bolIsLostStage = stageDto.bolIsLostStage,
                dtCreatedOn = now,
                bolIsActive = true
            };

            pipeline.Stages.Add(stage);
        }

        await _unitOfWork.Pipelines.AddAsync(pipeline);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Pipeline created: {PipelineGUID} - {PipelineName}",
            pipeline.strPipelineGUID, pipeline.strPipelineName);

        return await GetPipelineByIdAsync(pipeline.strPipelineGUID);
    }

    // ────────────────────────────────────────────────────────────────
    // UPDATE — Pipeline and stages (replace all stages)
    // ────────────────────────────────────────────────────────────────

    public async Task<PipelineDetailDto> UpdatePipelineAsync(Guid id, CreatePipelineDto dto)
    {
        // Validate
        _pipelineService.ValidatePipelineName(dto.strPipelineName);
        _pipelineService.ValidateStageOrder(dto.Stages);

        var pipeline = await _unitOfWork.Pipelines.Query()
            .Include(p => p.Stages)
            .Include(p => p.Opportunities)
            .Where(p => p.strPipelineGUID == id)
            .FirstOrDefaultAsync();

        if (pipeline == null)
            throw new NotFoundException("Pipeline not found", PipelineConstants.ErrorCodes.PipelineNotFound);

        var now = DateTime.UtcNow;
        var userGUID = GetCurrentUserId();

        // Check if trying to remove default status
        if (!dto.bolIsDefault && pipeline.bolIsDefault)
        {
            var otherDefaultCount = await _unitOfWork.Pipelines.Query()
                .CountAsync(p => p.bolIsDefault && p.strPipelineGUID != id);

            if (otherDefaultCount == 0)
            {
                throw new BusinessException(
                    "Cannot remove default status. At least one pipeline must be set as default.",
                    PipelineConstants.ErrorCodes.MustHaveDefault);
            }
        }

        // If this is being set as default, unset other defaults
        if (dto.bolIsDefault && !pipeline.bolIsDefault)
        {
            var existingDefaults = await _unitOfWork.Pipelines.Query()
                .Where(p => p.bolIsDefault && p.strPipelineGUID != id)
                .ToListAsync();

            foreach (var existing in existingDefaults)
            {
                existing.bolIsDefault = false;
                existing.dtUpdatedOn = now;
                existing.strUpdatedByGUID = userGUID;
                _unitOfWork.Pipelines.Update(existing);
            }
        }

        // Update pipeline properties
        pipeline.strPipelineName = dto.strPipelineName.Trim();
        pipeline.strDescription = dto.strDescription?.Trim();
        pipeline.bolIsDefault = dto.bolIsDefault;
        pipeline.dtUpdatedOn = now;
        pipeline.strUpdatedByGUID = userGUID;

        // Get existing stages
        var existingStages = pipeline.Stages.ToList();

        // Deactivate old stages that are not in the new list or update existing ones
        var stageMap = new Dictionary<string, MstPipelineStage>();
        foreach (var existingStage in existingStages)
        {
            var matchingDto = dto.Stages.FirstOrDefault(s =>
                s.strStageName.Trim().Equals(existingStage.strStageName.Trim(), StringComparison.OrdinalIgnoreCase));

            if (matchingDto != null)
            {
                // Update existing stage
                existingStage.intDisplayOrder = matchingDto.intDisplayOrder;
                existingStage.intProbabilityPercent = matchingDto.intProbabilityPercent;
                existingStage.intDefaultDaysToRot = matchingDto.intDefaultDaysToRot;
                existingStage.bolIsWonStage = matchingDto.bolIsWonStage;
                existingStage.bolIsLostStage = matchingDto.bolIsLostStage;
                existingStage.dtUpdatedOn = now;
                existingStage.bolIsActive = true;

                stageMap[matchingDto.strStageName.Trim().ToLower()] = existingStage;
            }
            else
            {
                // Deactivate stage not in new list
                existingStage.bolIsActive = false;
                existingStage.dtUpdatedOn = now;
            }
        }

        // Add new stages
        foreach (var stageDto in dto.Stages)
        {
            if (!stageMap.ContainsKey(stageDto.strStageName.Trim().ToLower()))
            {
                var newStage = new MstPipelineStage
                {
                    strStageGUID = Guid.NewGuid(),
                    strPipelineGUID = pipeline.strPipelineGUID,
                    strStageName = stageDto.strStageName.Trim(),
                    intDisplayOrder = stageDto.intDisplayOrder,
                    intProbabilityPercent = stageDto.intProbabilityPercent,
                    intDefaultDaysToRot = stageDto.intDefaultDaysToRot,
                    bolIsWonStage = stageDto.bolIsWonStage,
                    bolIsLostStage = stageDto.bolIsLostStage,
                    dtCreatedOn = now,
                    bolIsActive = true
                };

                pipeline.Stages.Add(newStage);
            }
        }

        _unitOfWork.Pipelines.Update(pipeline);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Pipeline updated: {PipelineGUID} - {PipelineName}",
            pipeline.strPipelineGUID, pipeline.strPipelineName);

        return await GetPipelineByIdAsync(pipeline.strPipelineGUID);
    }

    // ────────────────────────────────────────────────────────────────
    // DELETE — Soft delete (validation: no opportunities)
    // ────────────────────────────────────────────────────────────────

    public async Task<bool> DeletePipelineAsync(Guid id)
    {
        var pipeline = await _unitOfWork.Pipelines.Query()
            .Include(p => p.Opportunities)
            .Where(p => p.strPipelineGUID == id)
            .FirstOrDefaultAsync();

        if (pipeline == null)
            throw new NotFoundException("Pipeline not found", PipelineConstants.ErrorCodes.PipelineNotFound);

        var opportunityCount = pipeline.Opportunities.Count(o => o.bolIsActive && !o.bolIsDeleted);
        _pipelineService.ValidateForDeletion(pipeline, opportunityCount);

        var now = DateTime.UtcNow;

        pipeline.bolIsDeleted = true;
        pipeline.bolIsActive = false;
        pipeline.dtDeletedOn = now;
        pipeline.dtUpdatedOn = now;
        pipeline.strUpdatedByGUID = GetCurrentUserId();

        _unitOfWork.Pipelines.Update(pipeline);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Pipeline deleted: {PipelineGUID} - {PipelineName}",
            pipeline.strPipelineGUID, pipeline.strPipelineName);

        return true;
    }

    // ────────────────────────────────────────────────────────────────
    // SET DEFAULT — Make a pipeline the default one
    // ────────────────────────────────────────────────────────────────

    public async Task<PipelineDetailDto> SetDefaultPipelineAsync(Guid id)
    {
        var pipeline = await _unitOfWork.Pipelines.Query()
            .Where(p => p.strPipelineGUID == id)
            .FirstOrDefaultAsync();

        if (pipeline == null)
            throw new NotFoundException("Pipeline not found", PipelineConstants.ErrorCodes.PipelineNotFound);

        if (pipeline.bolIsDefault)
            return await GetPipelineByIdAsync(id); // Already default

        var now = DateTime.UtcNow;
        var userGUID = GetCurrentUserId();

        // Unset other defaults
        var existingDefaults = await _unitOfWork.Pipelines.Query()
            .Where(p => p.bolIsDefault)
            .ToListAsync();

        foreach (var existing in existingDefaults)
        {
            existing.bolIsDefault = false;
            existing.dtUpdatedOn = now;
            existing.strUpdatedByGUID = userGUID;
            _unitOfWork.Pipelines.Update(existing);
        }

        // Set new default
        pipeline.bolIsDefault = true;
        pipeline.dtUpdatedOn = now;
        pipeline.strUpdatedByGUID = userGUID;

        _unitOfWork.Pipelines.Update(pipeline);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Pipeline set as default: {PipelineGUID} - {PipelineName}",
            pipeline.strPipelineGUID, pipeline.strPipelineName);

        return await GetPipelineByIdAsync(id);
    }
}
