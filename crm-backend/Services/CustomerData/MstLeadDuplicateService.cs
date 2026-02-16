using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Helpers;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using Microsoft.EntityFrameworkCore;

namespace crm_backend.Services.CustomerData;

public class MstLeadDuplicateService : ServiceBase, ILeadDuplicateService
{
    private readonly IUnitOfWork _unitOfWork;

    public MstLeadDuplicateService(IUnitOfWork unitOfWork, ITenantContextProvider tenantContextProvider, ILogger<MstLeadDuplicateService> logger)
        : base(tenantContextProvider, logger) { _unitOfWork = unitOfWork; }

    public async Task<List<DuplicatePairDto>> CheckForDuplicatesAsync(MstLead lead)
    {
        var duplicates = new List<DuplicatePairDto>();
        var normalizedEmail = lead.strEmail.ToLowerInvariant().Trim();
        var normalizedPhone = DataNormalizationHelper.NormalizePhone(lead.strPhone);

        // Email match
        var emailMatches = await _unitOfWork.Leads.Query()
            .Where(l => l.strLeadGUID != lead.strLeadGUID && l.strEmail.ToLower() == normalizedEmail)
            .ToListAsync();

        foreach (var match in emailMatches)
        {
            var dup = new MstLeadDuplicate
            {
                strDuplicateGUID = Guid.NewGuid(), strGroupGUID = GetTenantId(),
                strLeadGUID1 = lead.strLeadGUID, strLeadGUID2 = match.strLeadGUID,
                strMatchType = "Email", dblConfidenceScore = 95.0m, strStatus = "Pending", dtCreatedOn = DateTime.UtcNow
            };
            await _unitOfWork.LeadDuplicates.AddAsync(dup);
            duplicates.Add(MapToPairDto(dup, lead, match));
        }

        // Phone match
        if (!string.IsNullOrWhiteSpace(normalizedPhone))
        {
            var phoneMatches = await _unitOfWork.Leads.Query()
                .Where(l => l.strLeadGUID != lead.strLeadGUID && l.strPhone != null && l.strPhone.Replace(" ", "").Replace("-", "") == normalizedPhone)
                .ToListAsync();

            foreach (var match in phoneMatches.Where(m => emailMatches.All(e => e.strLeadGUID != m.strLeadGUID)))
            {
                var dup = new MstLeadDuplicate
                {
                    strDuplicateGUID = Guid.NewGuid(), strGroupGUID = GetTenantId(),
                    strLeadGUID1 = lead.strLeadGUID, strLeadGUID2 = match.strLeadGUID,
                    strMatchType = "Phone", dblConfidenceScore = 85.0m, strStatus = "Pending", dtCreatedOn = DateTime.UtcNow
                };
                await _unitOfWork.LeadDuplicates.AddAsync(dup);
                duplicates.Add(MapToPairDto(dup, lead, match));
            }
        }

        // Fuzzy name match
        var fullName = $"{lead.strFirstName} {lead.strLastName}".Trim();
        var prefix = lead.strFirstName.Length >= 2 ? lead.strFirstName[..2].ToLower() : lead.strFirstName.ToLower();
        var candidates = await _unitOfWork.Leads.Query()
            .Where(l => l.strLeadGUID != lead.strLeadGUID && l.strFirstName.ToLower().StartsWith(prefix))
            .ToListAsync();

        foreach (var candidate in candidates.Where(c => emailMatches.All(e => e.strLeadGUID != c.strLeadGUID)))
        {
            var candidateName = $"{candidate.strFirstName} {candidate.strLastName}".Trim();
            var similarity = LevenshteinHelper.Similarity(fullName, candidateName);

            if (similarity >= 75.0)
            {
                var dup = new MstLeadDuplicate
                {
                    strDuplicateGUID = Guid.NewGuid(), strGroupGUID = GetTenantId(),
                    strLeadGUID1 = lead.strLeadGUID, strLeadGUID2 = candidate.strLeadGUID,
                    strMatchType = "FuzzyName", dblConfidenceScore = (decimal)similarity, strStatus = "Pending", dtCreatedOn = DateTime.UtcNow
                };
                await _unitOfWork.LeadDuplicates.AddAsync(dup);
                duplicates.Add(MapToPairDto(dup, lead, candidate));
            }
        }

        if (duplicates.Any()) await _unitOfWork.SaveChangesAsync();
        return duplicates;
    }

    public async Task ResolveDuplicateAsync(Guid duplicateGuid, string status)
    {
        var dup = await _unitOfWork.LeadDuplicates.GetByIdAsync(duplicateGuid);
        if (dup == null) throw new Exceptions.NotFoundException("Duplicate not found", "DUPLICATE_NOT_FOUND");
        dup.strStatus = status; dup.strResolvedByGUID = GetCurrentUserId(); dup.dtResolvedOn = DateTime.UtcNow;
        _unitOfWork.LeadDuplicates.Update(dup);
        await _unitOfWork.SaveChangesAsync();
    }

    private static DuplicatePairDto MapToPairDto(MstLeadDuplicate dup, MstLead lead1, MstLead lead2) => new()
    {
        strDuplicateGUID = dup.strDuplicateGUID, strLeadGUID1 = lead1.strLeadGUID,
        strLead1Name = $"{lead1.strFirstName} {lead1.strLastName}", strLead1Email = lead1.strEmail,
        strLeadGUID2 = lead2.strLeadGUID, strLead2Name = $"{lead2.strFirstName} {lead2.strLastName}",
        strLead2Email = lead2.strEmail, strMatchType = dup.strMatchType,
        dblConfidenceScore = dup.dblConfidenceScore, strStatus = dup.strStatus, dtCreatedOn = dup.dtCreatedOn
    };
}
