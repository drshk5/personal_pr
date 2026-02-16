using Microsoft.EntityFrameworkCore;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.DTOs.Common;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.CustomerData;

public class MstLeadDuplicateApplicationService : ApplicationServiceBase, IMstLeadDuplicateApplicationService
{
    private readonly ILeadDuplicateService _duplicateService;
    private readonly ILeadMergeService _mergeService;

    public MstLeadDuplicateApplicationService(
        IUnitOfWork unitOfWork, ITenantContextProvider tenantContextProvider,
        ILeadDuplicateService duplicateService, ILeadMergeService mergeService,
        ILogger<MstLeadDuplicateApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger) { _duplicateService = duplicateService; _mergeService = mergeService; }

    public async Task<List<DuplicatePairDto>> CheckDuplicatesAsync(Guid leadId)
    {
        var lead = await _unitOfWork.Leads.GetByIdAsync(leadId);
        if (lead == null) throw new NotFoundException("Lead not found", LeadErrorCodes.LeadNotFound);
        return await _duplicateService.CheckForDuplicatesAsync(lead);
    }

    public async Task<PagedResponse<DuplicatePairDto>> GetSuggestionsAsync(DuplicateFilterParams filter)
    {
        var query = _unitOfWork.LeadDuplicates.Query();
        if (!string.IsNullOrWhiteSpace(filter.strStatus)) query = query.Where(d => d.strStatus == filter.strStatus);
        else query = query.Where(d => d.strStatus == "Pending");
        if (!string.IsNullOrWhiteSpace(filter.strMatchType)) query = query.Where(d => d.strMatchType == filter.strMatchType);

        var totalCount = await query.CountAsync();
        var items = await query.OrderByDescending(d => d.dblConfidenceScore)
            .Skip((filter.PageNumber - 1) * filter.PageSize).Take(filter.PageSize)
            .Include(d => d.Lead1).Include(d => d.Lead2).ToListAsync();

        return new PagedResponse<DuplicatePairDto>
        {
            Items = items.Select(d => new DuplicatePairDto
            {
                strDuplicateGUID = d.strDuplicateGUID, strLeadGUID1 = d.strLeadGUID1,
                strLead1Name = d.Lead1 != null ? $"{d.Lead1.strFirstName} {d.Lead1.strLastName}" : "",
                strLead1Email = d.Lead1?.strEmail ?? "", strLeadGUID2 = d.strLeadGUID2,
                strLead2Name = d.Lead2 != null ? $"{d.Lead2.strFirstName} {d.Lead2.strLastName}" : "",
                strLead2Email = d.Lead2?.strEmail ?? "", strMatchType = d.strMatchType,
                dblConfidenceScore = d.dblConfidenceScore, strStatus = d.strStatus, dtCreatedOn = d.dtCreatedOn
            }).ToList(),
            TotalCount = totalCount, PageNumber = filter.PageNumber, PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task ResolveDuplicateAsync(Guid duplicateId, DuplicateResolveDto dto) => await _duplicateService.ResolveDuplicateAsync(duplicateId, dto.strStatus);

    public async Task<LeadMergeResultDto> MergeLeadsAsync(LeadMergeRequestDto dto) => await _mergeService.MergeLeadsAsync(dto);

    public async Task<PagedResponse<MergeHistoryListDto>> GetMergeHistoryAsync(PagedRequestDto paging)
    {
        var query = _unitOfWork.LeadMergeHistory.Query();
        var totalCount = await query.CountAsync();
        var items = await query.OrderByDescending(h => h.dtMergedOn)
            .Skip((paging.PageNumber - 1) * paging.PageSize).Take(paging.PageSize).ToListAsync();

        return new PagedResponse<MergeHistoryListDto>
        {
            Items = items.Select(h => new MergeHistoryListDto
            {
                strMergeHistoryGUID = h.strMergeHistoryGUID, strSurvivorLeadGUID = h.strSurvivorLeadGUID,
                strMergedLeadGUID = h.strMergedLeadGUID, strMergedByGUID = h.strMergedByGUID, dtMergedOn = h.dtMergedOn
            }).ToList(),
            TotalCount = totalCount, PageNumber = paging.PageNumber, PageSize = paging.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)paging.PageSize)
        };
    }
}
