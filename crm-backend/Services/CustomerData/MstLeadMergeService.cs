using System.Text.Json;
using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using Microsoft.EntityFrameworkCore;

namespace crm_backend.Services.CustomerData;

public class MstLeadMergeService : ServiceBase, ILeadMergeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogService _auditLogService;

    public MstLeadMergeService(IUnitOfWork unitOfWork, ITenantContextProvider tenantContextProvider, IAuditLogService auditLogService, ILogger<MstLeadMergeService> logger)
        : base(tenantContextProvider, logger) { _unitOfWork = unitOfWork; _auditLogService = auditLogService; }

    public async Task<LeadMergeResultDto> MergeLeadsAsync(LeadMergeRequestDto request)
    {
        var survivor = await _unitOfWork.Leads.GetByIdAsync(request.strSurvivorLeadGUID);
        var merged = await _unitOfWork.Leads.GetByIdAsync(request.strMergedLeadGUID);
        if (survivor == null || merged == null) throw new NotFoundException("One or both leads not found", LeadErrorCodes.LeadNotFound);

        // Snapshot merged lead
        var mergeHistory = new MstLeadMergeHistory
        {
            strMergeHistoryGUID = Guid.NewGuid(), strGroupGUID = GetTenantId(),
            strSurvivorLeadGUID = survivor.strLeadGUID, strMergedLeadGUID = merged.strLeadGUID,
            strMergedDataJson = JsonSerializer.Serialize(merged), strMergedByGUID = GetCurrentUserId(), dtMergedOn = DateTime.UtcNow
        };
        await _unitOfWork.LeadMergeHistory.AddAsync(mergeHistory);

        // Apply field selection
        var fields = request.FieldSelection ?? new MergeFieldSelectionDto();
        if (fields.strPhoneFrom == "merged" && !string.IsNullOrWhiteSpace(merged.strPhone)) survivor.strPhone = merged.strPhone;
        if (fields.strCompanyNameFrom == "merged" && !string.IsNullOrWhiteSpace(merged.strCompanyName)) survivor.strCompanyName = merged.strCompanyName;
        if (fields.strJobTitleFrom == "merged" && !string.IsNullOrWhiteSpace(merged.strJobTitle)) survivor.strJobTitle = merged.strJobTitle;
        if (fields.strAddressFrom == "merged") { survivor.strAddress = merged.strAddress; survivor.strCity = merged.strCity; survivor.strState = merged.strState; survivor.strCountry = merged.strCountry; survivor.strPostalCode = merged.strPostalCode; }
        if (fields.strNotesFrom == "merge" && !string.IsNullOrWhiteSpace(merged.strNotes))
            survivor.strNotes = string.IsNullOrWhiteSpace(survivor.strNotes) ? merged.strNotes : $"{survivor.strNotes}\n---\n{merged.strNotes}";

        // Transfer activity links
        var mergedActivityLinks = await _unitOfWork.ActivityLinks.Query()
            .Where(al => al.strEntityType == EntityTypeConstants.Lead && al.strEntityGUID == merged.strLeadGUID).ToListAsync();
        foreach (var link in mergedActivityLinks) { link.strEntityGUID = survivor.strLeadGUID; _unitOfWork.ActivityLinks.Update(link); }

        // Transfer communications
        var mergedComms = await _unitOfWork.LeadCommunications.GetByLeadIdAsync(merged.strLeadGUID);
        foreach (var comm in mergedComms) { comm.strLeadGUID = survivor.strLeadGUID; _unitOfWork.LeadCommunications.Update(comm); }

        // Soft-delete merged lead
        merged.bolIsDeleted = true; merged.bolIsActive = false; merged.dtDeletedOn = DateTime.UtcNow;
        merged.strUpdatedByGUID = GetCurrentUserId(); merged.dtUpdatedOn = DateTime.UtcNow;
        _unitOfWork.Leads.Update(merged);

        // Update duplicate records
        var relatedDups = await _unitOfWork.LeadDuplicates.GetByLeadIdAsync(merged.strLeadGUID);
        foreach (var dup in relatedDups.Where(d => d.strStatus == "Pending"))
        { dup.strStatus = "Merged"; dup.strResolvedByGUID = GetCurrentUserId(); dup.dtResolvedOn = DateTime.UtcNow; _unitOfWork.LeadDuplicates.Update(dup); }

        survivor.strUpdatedByGUID = GetCurrentUserId(); survivor.dtUpdatedOn = DateTime.UtcNow;
        _unitOfWork.Leads.Update(survivor);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(EntityTypeConstants.Lead, survivor.strLeadGUID, "Merge",
            JsonSerializer.Serialize(new { SurvivorGUID = survivor.strLeadGUID, MergedGUID = merged.strLeadGUID }), GetCurrentUserId());

        return new LeadMergeResultDto { strSurvivorLeadGUID = survivor.strLeadGUID, strMergedLeadGUID = merged.strLeadGUID, strMessage = "Leads merged successfully" };
    }
}
