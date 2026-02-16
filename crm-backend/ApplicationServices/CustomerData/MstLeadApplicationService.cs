using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Exceptions;
using crm_backend.Helpers;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using crm_backend.Models.Wrappers;
using System.Linq.Dynamic.Core;

namespace crm_backend.ApplicationServices.CustomerData;

public class MstLeadApplicationService : ApplicationServiceBase, IMstLeadApplicationService
{
    private readonly ILeadService _leadService;
    private readonly IAuditLogService _auditLogService;
    private readonly MasterDbContext _masterDbContext;

    public MstLeadApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        MasterDbContext masterDbContext,
        ILeadService leadService,
        IAuditLogService auditLogService,
        ILogger<MstLeadApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _masterDbContext = masterDbContext;
        _leadService = leadService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResponse<LeadListDto>> GetLeadsAsync(LeadFilterParams filter)
    {
        var query = _unitOfWork.Leads.Query();

        // Apply archived filter
        if (filter.bolIsActive.HasValue)
            query = query.Where(l => l.bolIsActive == filter.bolIsActive.Value);

        // Apply status filter
        if (!string.IsNullOrWhiteSpace(filter.strStatus))
            query = query.Where(l => l.strStatus == filter.strStatus);

        // Apply source filter
        if (!string.IsNullOrWhiteSpace(filter.strSource))
            query = query.Where(l => l.strSource == filter.strSource);

        // Apply assignee filter
        if (filter.strAssignedToGUID.HasValue)
            query = query.Where(l => l.strAssignedToGUID == filter.strAssignedToGUID.Value);

        // Apply date range filter
        if (filter.dtFromDate.HasValue)
            query = query.Where(l => l.dtCreatedOn >= filter.dtFromDate.Value);
        if (filter.dtToDate.HasValue)
            query = query.Where(l => l.dtCreatedOn <= filter.dtToDate.Value);

        // Apply score range filter
        if (filter.intMinScore.HasValue)
            query = query.Where(l => l.intLeadScore >= filter.intMinScore.Value);
        if (filter.intMaxScore.HasValue)
            query = query.Where(l => l.intLeadScore <= filter.intMaxScore.Value);

        // Apply search
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.ToLower().Trim();
            query = query.Where(l =>
                l.strFirstName.ToLower().Contains(searchTerm) ||
                l.strLastName.ToLower().Contains(searchTerm) ||
                l.strEmail.ToLower().Contains(searchTerm) ||
                (l.strCompanyName != null && l.strCompanyName.ToLower().Contains(searchTerm)) ||
                (l.strPhone != null && l.strPhone.Contains(searchTerm)));
        }

        // Get total count
        var totalCount = await query.CountAsync();

        // Apply sorting
        if (!string.IsNullOrWhiteSpace(filter.SortBy))
        {
            var direction = filter.Ascending ? "ascending" : "descending";
            query = query.OrderBy($"{filter.SortBy} {direction}");
        }
        else
        {
            query = query.OrderByDescending(l => l.dtCreatedOn);
        }

        // Apply pagination
        var items = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var leadDtos = items.Select(MapToListDto).ToList();

        // Enrich with user names from master DB
        await EnrichLeadDtosWithUserNamesAsync(leadDtos);

        return new PagedResponse<LeadListDto>
        {
            Items = leadDtos,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<LeadDetailDto> GetLeadByIdAsync(Guid id)
    {
        var lead = await _unitOfWork.Leads.GetByIdAsync(id);
        if (lead == null)
            throw new NotFoundException("Lead not found", LeadErrorCodes.LeadNotFound);

        var activities = await _unitOfWork.ActivityLinks.Query()
            .AsNoTracking()
            .Where(al => al.strEntityType == EntityTypeConstants.Lead
                && al.strEntityGUID == id)
            .OrderByDescending(al => al.Activity.dtCreatedOn)
            .Take(10)
            .Select(al => new ActivityListDto
            {
                strActivityGUID = al.Activity.strActivityGUID,
                strActivityType = al.Activity.strActivityType,
                strSubject = al.Activity.strSubject,
                strDescription = al.Activity.strDescription,
                dtScheduledOn = al.Activity.dtScheduledOn,
                dtCompletedOn = al.Activity.dtCompletedOn,
                intDurationMinutes = al.Activity.dtScheduledOn.HasValue && al.Activity.dtCompletedOn.HasValue
                    ? EF.Functions.DateDiffMinute(al.Activity.dtScheduledOn.Value, al.Activity.dtCompletedOn.Value)
                    : al.Activity.intDurationMinutes,
                strOutcome = al.Activity.strOutcome,
                strAssignedToGUID = al.Activity.strAssignedToGUID,
                strAssignedToName = null,
                strCreatedByGUID = al.Activity.strCreatedByGUID,
                strCreatedByName = string.Empty,
                dtCreatedOn = al.Activity.dtCreatedOn,
                bolIsActive = al.Activity.bolIsActive,
                Links = new List<ActivityLinkDto>()
            })
            .ToListAsync();

        var detail = MapToDetailDto(lead);
        detail.RecentActivities = activities;

        // Enrich lead detail with user names
        var detailList = new List<LeadListDto> { detail };
        await EnrichLeadDtosWithUserNamesAsync(detailList);

        // Also populate createdBy name
        var creatorIds = new List<Guid> { lead.strCreatedByGUID };
        var creators = await _masterDbContext.MstUsers
            .AsNoTracking()
            .Where(u => u.strGroupGUID == GetTenantId() && creatorIds.Contains(u.strUserGUID))
            .Select(u => new { u.strUserGUID, u.strName })
            .ToListAsync();
        var creator = creators.FirstOrDefault(u => u.strUserGUID == lead.strCreatedByGUID);
        if (creator != null)
            detail.strCreatedByName = creator.strName;

        return detail;
    }

    public async Task<LeadDetailDto> CreateLeadAsync(CreateLeadDto dto)
    {
        // Normalize data
        var normalizedEmail = DataNormalizationHelper.NormalizeEmail(dto.strEmail);

        // Check for duplicate email
        var existingLead = await _unitOfWork.Leads.GetByEmailAsync(normalizedEmail, GetTenantId());
        if (existingLead != null)
            throw new BusinessException("A lead with this email already exists", LeadErrorCodes.DuplicateEmail);

        var lead = new MstLead
        {
            strLeadGUID = Guid.NewGuid(),
            strGroupGUID = GetTenantId(),
            strFirstName = dto.strFirstName.Trim(),
            strLastName = dto.strLastName.Trim(),
            strEmail = normalizedEmail,
            strPhone = DataNormalizationHelper.NormalizePhone(dto.strPhone),
            strCompanyName = DataNormalizationHelper.TrimOrNull(dto.strCompanyName),
            strJobTitle = DataNormalizationHelper.TrimOrNull(dto.strJobTitle),
            strSource = dto.strSource,
            strStatus = LeadStatusConstants.New,
            strAddress = DataNormalizationHelper.TrimOrNull(dto.strAddress),
            strCity = DataNormalizationHelper.TrimOrNull(dto.strCity),
            strState = DataNormalizationHelper.TrimOrNull(dto.strState),
            strCountry = DataNormalizationHelper.TrimOrNull(dto.strCountry),
            strPostalCode = DataNormalizationHelper.TrimOrNull(dto.strPostalCode),
            strNotes = DataNormalizationHelper.TrimOrNull(dto.strNotes),
            strAssignedToGUID = dto.strAssignedToGUID,
            strCreatedByGUID = GetCurrentUserId(),
            dtCreatedOn = DateTime.UtcNow,
            bolIsActive = true,
            bolIsDeleted = false
        };

        // Calculate lead score
        lead.intLeadScore = _leadService.CalculateScore(lead);

        await _unitOfWork.Leads.AddAsync(lead);
        await _unitOfWork.SaveChangesAsync();

        // Audit log
        await _auditLogService.LogAsync(
            EntityTypeConstants.Lead,
            lead.strLeadGUID,
            "Create",
            JsonSerializer.Serialize(new { dto.strFirstName, dto.strLastName, dto.strEmail, dto.strSource }),
            GetCurrentUserId());

        _logger.LogInformation("Lead created: {LeadGUID} by {UserGUID}", lead.strLeadGUID, GetCurrentUserId());

        return await GetLeadByIdAsync(lead.strLeadGUID);
    }

    public async Task<LeadDetailDto> UpdateLeadAsync(Guid id, UpdateLeadDto dto)
    {
        var lead = await _unitOfWork.Leads.GetByIdAsync(id);
        if (lead == null)
            throw new NotFoundException("Lead not found", LeadErrorCodes.LeadNotFound);

        // Normalize and check email uniqueness if changed
        var normalizedEmail = DataNormalizationHelper.NormalizeEmail(dto.strEmail);
        if (normalizedEmail != lead.strEmail.ToLowerInvariant())
        {
            var existingLead = await _unitOfWork.Leads.GetByEmailAsync(normalizedEmail, GetTenantId());
            if (existingLead != null && existingLead.strLeadGUID != id)
                throw new BusinessException("A lead with this email already exists", LeadErrorCodes.DuplicateEmail);
        }

        // Validate status transition if status changed
        if (dto.strStatus != lead.strStatus)
            _leadService.ValidateStatusTransition(lead.strStatus, dto.strStatus);

        // Capture old values for audit
        var oldValues = JsonSerializer.Serialize(new { lead.strFirstName, lead.strLastName, lead.strEmail, lead.strStatus });

        // Update fields
        lead.strFirstName = dto.strFirstName.Trim();
        lead.strLastName = dto.strLastName.Trim();
        lead.strEmail = normalizedEmail;
        lead.strPhone = DataNormalizationHelper.NormalizePhone(dto.strPhone);
        lead.strCompanyName = DataNormalizationHelper.TrimOrNull(dto.strCompanyName);
        lead.strJobTitle = DataNormalizationHelper.TrimOrNull(dto.strJobTitle);
        lead.strSource = dto.strSource;
        lead.strStatus = dto.strStatus;
        lead.strAddress = DataNormalizationHelper.TrimOrNull(dto.strAddress);
        lead.strCity = DataNormalizationHelper.TrimOrNull(dto.strCity);
        lead.strState = DataNormalizationHelper.TrimOrNull(dto.strState);
        lead.strCountry = DataNormalizationHelper.TrimOrNull(dto.strCountry);
        lead.strPostalCode = DataNormalizationHelper.TrimOrNull(dto.strPostalCode);
        lead.strNotes = DataNormalizationHelper.TrimOrNull(dto.strNotes);
        lead.strAssignedToGUID = dto.strAssignedToGUID;
        lead.strUpdatedByGUID = GetCurrentUserId();
        lead.dtUpdatedOn = DateTime.UtcNow;

        // Recalculate score
        lead.intLeadScore = _leadService.CalculateScore(lead);

        _unitOfWork.Leads.Update(lead);
        await _unitOfWork.SaveChangesAsync();

        // Audit log
        var newValues = JsonSerializer.Serialize(new { dto.strFirstName, dto.strLastName, dto.strEmail, dto.strStatus });
        await _auditLogService.LogAsync(
            EntityTypeConstants.Lead,
            lead.strLeadGUID,
            "Update",
            JsonSerializer.Serialize(new { Old = oldValues, New = newValues }),
            GetCurrentUserId());

        return await GetLeadByIdAsync(lead.strLeadGUID);
    }

    public async Task<bool> DeleteLeadAsync(Guid id)
    {
        var lead = await _unitOfWork.Leads.GetByIdAsync(id);
        if (lead == null)
            throw new NotFoundException("Lead not found", LeadErrorCodes.LeadNotFound);

        // Soft delete
        lead.bolIsDeleted = true;
        lead.bolIsActive = false;
        lead.dtDeletedOn = DateTime.UtcNow;
        lead.strUpdatedByGUID = GetCurrentUserId();
        lead.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.Leads.Update(lead);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(
            EntityTypeConstants.Lead,
            lead.strLeadGUID,
            "Delete",
            null,
            GetCurrentUserId());

        return true;
    }

    public async Task<LeadDetailDto> ChangeStatusAsync(Guid id, string newStatus)
    {
        var lead = await _unitOfWork.Leads.GetByIdAsync(id);
        if (lead == null)
            throw new NotFoundException("Lead not found", LeadErrorCodes.LeadNotFound);

        var oldStatus = lead.strStatus;
        _leadService.ValidateStatusTransition(oldStatus, newStatus);

        lead.strStatus = newStatus;
        lead.strUpdatedByGUID = GetCurrentUserId();
        lead.dtUpdatedOn = DateTime.UtcNow;
        lead.intLeadScore = _leadService.CalculateScore(lead);

        _unitOfWork.Leads.Update(lead);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(
            EntityTypeConstants.Lead,
            lead.strLeadGUID,
            "Update",
            JsonSerializer.Serialize(new { OldStatus = oldStatus, NewStatus = newStatus }),
            GetCurrentUserId());

        return await GetLeadByIdAsync(lead.strLeadGUID);
    }

    public async Task<bool> BulkArchiveAsync(LeadBulkArchiveDto dto)
    {
        foreach (var guid in dto.Guids)
        {
            var lead = await _unitOfWork.Leads.GetByIdAsync(guid);
            if (lead != null)
            {
                lead.bolIsActive = false;
                lead.strUpdatedByGUID = GetCurrentUserId();
                lead.dtUpdatedOn = DateTime.UtcNow;
                _unitOfWork.Leads.Update(lead);
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> BulkRestoreAsync(LeadBulkArchiveDto dto)
    {
        foreach (var guid in dto.Guids)
        {
            var lead = await _unitOfWork.Leads.GetByIdAsync(guid);
            if (lead != null)
            {
                lead.bolIsActive = true;
                lead.strUpdatedByGUID = GetCurrentUserId();
                lead.dtUpdatedOn = DateTime.UtcNow;
                _unitOfWork.Leads.Update(lead);
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<LeadListDto> GetConversionPreviewAsync(Guid id)
    {
        var lead = await _unitOfWork.Leads.GetByIdAsync(id);
        if (lead == null)
            throw new NotFoundException("Lead not found", LeadErrorCodes.LeadNotFound);

        return MapToListDto(lead);
    }

    public async Task<LeadConversionResultDto> ConvertLeadAsync(ConvertLeadDto dto)
    {
        var lead = await _unitOfWork.Leads.GetByIdAsync(dto.strLeadGUID);
        if (lead == null)
            throw new NotFoundException("Lead not found", LeadErrorCodes.LeadNotFound);

        if (!LeadStatusConstants.ConvertibleStatuses.Contains(lead.strStatus))
            throw new BusinessException("Only qualified leads can be converted", LeadErrorCodes.LeadNotQualified);

        if (lead.dtConvertedOn.HasValue || lead.strStatus == LeadStatusConstants.Converted)
            throw new BusinessException("Lead is already converted", LeadErrorCodes.LeadAlreadyConverted);

        if (!dto.bolCreateAccount && !dto.strExistingAccountGUID.HasValue)
            throw new BusinessException("Existing account is required when create-account is disabled");

        var now = DateTime.UtcNow;
        var userId = GetCurrentUserId();
        Guid? accountGuid = null;
        Guid? opportunityGuid = null;

        if (dto.bolCreateAccount)
        {
            var accountName = !string.IsNullOrWhiteSpace(lead.strCompanyName)
                ? lead.strCompanyName.Trim()
                : $"{lead.strFirstName} {lead.strLastName}".Trim();

            var account = new MstAccount
            {
                strAccountGUID = Guid.NewGuid(),
                strGroupGUID = GetTenantId(),
                strAccountName = accountName,
                strPhone = lead.strPhone,
                strEmail = lead.strEmail,
                strAddress = lead.strAddress,
                strCity = lead.strCity,
                strState = lead.strState,
                strCountry = lead.strCountry,
                strPostalCode = lead.strPostalCode,
                strDescription = lead.strNotes,
                strAssignedToGUID = lead.strAssignedToGUID,
                strCreatedByGUID = userId,
                dtCreatedOn = now,
                bolIsActive = true,
                bolIsDeleted = false
            };

            await _unitOfWork.Accounts.AddAsync(account);
            accountGuid = account.strAccountGUID;
        }
        else
        {
            var existingAccount = await _unitOfWork.Accounts.Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.strAccountGUID == dto.strExistingAccountGUID!.Value);

            if (existingAccount == null)
                throw new NotFoundException("Account not found", "ACCOUNT_NOT_FOUND");

            accountGuid = existingAccount.strAccountGUID;
        }

        var contact = new MstContact
        {
            strContactGUID = Guid.NewGuid(),
            strGroupGUID = GetTenantId(),
            strAccountGUID = accountGuid,
            strFirstName = lead.strFirstName,
            strLastName = lead.strLastName,
            strEmail = lead.strEmail,
            strPhone = lead.strPhone,
            strMobilePhone = lead.strPhone,
            strJobTitle = lead.strJobTitle,
            strLifecycleStage = ContactLifecycleStageConstants.Opportunity,
            strAddress = lead.strAddress,
            strCity = lead.strCity,
            strState = lead.strState,
            strCountry = lead.strCountry,
            strPostalCode = lead.strPostalCode,
            strNotes = lead.strNotes,
            strAssignedToGUID = lead.strAssignedToGUID,
            strCreatedByGUID = userId,
            dtCreatedOn = now,
            bolIsActive = true,
            bolIsDeleted = false
        };

        await _unitOfWork.Contacts.AddAsync(contact);

        if (dto.bolCreateOpportunity)
        {
            var pipeline = dto.strPipelineGUID.HasValue
                ? await _unitOfWork.Pipelines.Query()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.strPipelineGUID == dto.strPipelineGUID.Value && p.bolIsActive)
                : await _unitOfWork.Pipelines.GetDefaultPipelineAsync();

            pipeline ??= await _unitOfWork.Pipelines.Query()
                .AsNoTracking()
                .OrderByDescending(p => p.bolIsDefault)
                .ThenByDescending(p => p.dtCreatedOn)
                .FirstOrDefaultAsync(p => p.bolIsActive);

            if (pipeline == null)
                throw new NotFoundException("No active pipeline found", PipelineConstants.ErrorCodes.PipelineNotFound);

            var firstStage = await _unitOfWork.PipelineStages.GetFirstStageAsync(pipeline.strPipelineGUID);
            if (firstStage == null)
                throw new NotFoundException("No active stage found in selected pipeline", PipelineConstants.ErrorCodes.StageNotFound);

            var opportunityName = !string.IsNullOrWhiteSpace(dto.strOpportunityName)
                ? dto.strOpportunityName!.Trim()
                : BuildDefaultOpportunityName(lead);

            var opportunity = new MstOpportunity
            {
                strOpportunityGUID = Guid.NewGuid(),
                strGroupGUID = GetTenantId(),
                strOpportunityName = opportunityName,
                strAccountGUID = accountGuid,
                strPipelineGUID = pipeline.strPipelineGUID,
                strStageGUID = firstStage.strStageGUID,
                strStatus = "Open",
                dblAmount = dto.dblAmount,
                strCurrency = "INR",
                intProbability = firstStage.intProbabilityPercent,
                strDescription = lead.strNotes,
                dtStageEnteredOn = now,
                strAssignedToGUID = lead.strAssignedToGUID,
                strCreatedByGUID = userId,
                dtCreatedOn = now,
                bolIsActive = true,
                bolIsDeleted = false
            };

            await _unitOfWork.Opportunities.AddAsync(opportunity);
            opportunityGuid = opportunity.strOpportunityGUID;

            await _unitOfWork.OpportunityContacts.AddAsync(new MstOpportunityContact
            {
                strOpportunityContactGUID = Guid.NewGuid(),
                strOpportunityGUID = opportunity.strOpportunityGUID,
                strContactGUID = contact.strContactGUID,
                strRole = "Primary",
                bolIsPrimary = true,
                dtCreatedOn = now
            });
        }

        var leadActivityLinks = await _unitOfWork.ActivityLinks.Query()
            .AsNoTracking()
            .Where(al => al.strEntityType == EntityTypeConstants.Lead && al.strEntityGUID == lead.strLeadGUID)
            .Select(al => new { al.strActivityGUID })
            .ToListAsync();

        foreach (var link in leadActivityLinks)
        {
            await _unitOfWork.ActivityLinks.AddAsync(new MstActivityLink
            {
                strActivityLinkGUID = Guid.NewGuid(),
                strActivityGUID = link.strActivityGUID,
                strEntityType = EntityTypeConstants.Contact,
                strEntityGUID = contact.strContactGUID,
                dtCreatedOn = now
            });

            if (accountGuid.HasValue)
            {
                await _unitOfWork.ActivityLinks.AddAsync(new MstActivityLink
                {
                    strActivityLinkGUID = Guid.NewGuid(),
                    strActivityGUID = link.strActivityGUID,
                    strEntityType = EntityTypeConstants.Account,
                    strEntityGUID = accountGuid.Value,
                    dtCreatedOn = now
                });
            }

            if (opportunityGuid.HasValue)
            {
                await _unitOfWork.ActivityLinks.AddAsync(new MstActivityLink
                {
                    strActivityLinkGUID = Guid.NewGuid(),
                    strActivityGUID = link.strActivityGUID,
                    strEntityType = EntityTypeConstants.Opportunity,
                    strEntityGUID = opportunityGuid.Value,
                    dtCreatedOn = now
                });
            }
        }

        lead.strStatus = LeadStatusConstants.Converted;
        lead.strConvertedAccountGUID = accountGuid;
        lead.strConvertedContactGUID = contact.strContactGUID;
        lead.strConvertedOpportunityGUID = opportunityGuid;
        lead.dtConvertedOn = now;
        lead.strUpdatedByGUID = userId;
        lead.dtUpdatedOn = now;
        _unitOfWork.Leads.Update(lead);

        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(
            EntityTypeConstants.Lead,
            lead.strLeadGUID,
            "Convert",
            JsonSerializer.Serialize(new
            {
                strContactGUID = contact.strContactGUID,
                strAccountGUID = accountGuid,
                strOpportunityGUID = opportunityGuid
            }),
            userId);

        return new LeadConversionResultDto
        {
            strLeadGUID = lead.strLeadGUID,
            strContactGUID = contact.strContactGUID,
            strAccountGUID = accountGuid,
            strOpportunityGUID = opportunityGuid,
            strMessage = "Lead converted successfully"
        };
    }

    // === Mapping Methods ===

    private static string BuildDefaultOpportunityName(MstLead lead)
    {
        if (!string.IsNullOrWhiteSpace(lead.strCompanyName))
            return $"{lead.strCompanyName.Trim()} - New Opportunity";

        var fullName = $"{lead.strFirstName} {lead.strLastName}".Trim();
        return $"{fullName} - Opportunity";
    }

    private static LeadListDto MapToListDto(MstLead lead)
    {
        return new LeadListDto
        {
            strLeadGUID = lead.strLeadGUID,
            strFirstName = lead.strFirstName,
            strLastName = lead.strLastName,
            strEmail = lead.strEmail,
            strPhone = lead.strPhone,
            strCompanyName = lead.strCompanyName,
            strSource = lead.strSource,
            strStatus = lead.strStatus,
            intLeadScore = lead.intLeadScore,
            strAssignedToGUID = lead.strAssignedToGUID,
            dtCreatedOn = lead.dtCreatedOn,
            bolIsActive = lead.bolIsActive
        };
    }

    private static LeadDetailDto MapToDetailDto(MstLead lead)
    {
        return new LeadDetailDto
        {
            strLeadGUID = lead.strLeadGUID,
            strFirstName = lead.strFirstName,
            strLastName = lead.strLastName,
            strEmail = lead.strEmail,
            strPhone = lead.strPhone,
            strCompanyName = lead.strCompanyName,
            strSource = lead.strSource,
            strStatus = lead.strStatus,
            intLeadScore = lead.intLeadScore,
            strAssignedToGUID = lead.strAssignedToGUID,
            dtCreatedOn = lead.dtCreatedOn,
            bolIsActive = lead.bolIsActive,
            strJobTitle = lead.strJobTitle,
            strAddress = lead.strAddress,
            strCity = lead.strCity,
            strState = lead.strState,
            strCountry = lead.strCountry,
            strPostalCode = lead.strPostalCode,
            strNotes = lead.strNotes,
            strConvertedAccountGUID = lead.strConvertedAccountGUID,
            strConvertedContactGUID = lead.strConvertedContactGUID,
            strConvertedOpportunityGUID = lead.strConvertedOpportunityGUID,
            dtConvertedOn = lead.dtConvertedOn,
            dtUpdatedOn = lead.dtUpdatedOn,
            RecentActivities = new List<ActivityListDto>()
        };
    }

    /// <summary>
    /// Enrich lead DTOs with assigned user names from master DB (single batch query).
    /// </summary>
    private async Task EnrichLeadDtosWithUserNamesAsync(List<LeadListDto> leads)
    {
        var assigneeIds = leads
            .Where(l => l.strAssignedToGUID.HasValue)
            .Select(l => l.strAssignedToGUID!.Value)
            .Distinct()
            .ToList();

        if (assigneeIds.Count == 0)
            return;

        var users = await _masterDbContext.MstUsers
            .AsNoTracking()
            .Where(u => u.strGroupGUID == GetTenantId() && assigneeIds.Contains(u.strUserGUID))
            .Select(u => new { u.strUserGUID, u.strName })
            .ToListAsync();

        var nameById = users.ToDictionary(u => u.strUserGUID, u => u.strName);

        foreach (var lead in leads)
        {
            if (lead.strAssignedToGUID.HasValue
                && nameById.TryGetValue(lead.strAssignedToGUID.Value, out var name))
            {
                lead.strAssignedToName = name;
            }
        }
    }
}
