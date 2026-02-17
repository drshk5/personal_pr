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

public class MstContactApplicationService : ApplicationServiceBase, IMstContactApplicationService
{
    private readonly MasterDbContext _masterDbContext;
    private readonly IContactService _contactService;
    private readonly IAuditLogService _auditLogService;

    public MstContactApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        MasterDbContext masterDbContext,
        IContactService contactService,
        IAuditLogService auditLogService,
        ILogger<MstContactApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _masterDbContext = masterDbContext;
        _contactService = contactService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResponse<ContactListDto>> GetContactsAsync(ContactFilterParams filter)
    {
        var query = _unitOfWork.Contacts.Query().AsNoTracking();

        // Apply filters before join — lets SQL filter early
        if (filter.bolIsActive.HasValue)
            query = query.Where(c => c.bolIsActive == filter.bolIsActive.Value);

        if (filter.strAccountGUID.HasValue)
            query = query.Where(c => c.strAccountGUID == filter.strAccountGUID.Value);

        if (!string.IsNullOrWhiteSpace(filter.strLifecycleStage))
            query = query.Where(c => c.strLifecycleStage == filter.strLifecycleStage);

        if (filter.strAssignedToGUID.HasValue)
            query = query.Where(c => c.strAssignedToGUID == filter.strAssignedToGUID.Value);

        // Search — SQL Server uses case-insensitive collation by default, no .ToLower() needed
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.Trim();
            query = query.Where(c =>
                c.strFirstName.Contains(searchTerm) ||
                c.strLastName.Contains(searchTerm) ||
                c.strEmail.Contains(searchTerm) ||
                (c.strPhone != null && c.strPhone.Contains(searchTerm)) ||
                (c.strJobTitle != null && c.strJobTitle.Contains(searchTerm)) ||
                (c.Account != null && c.Account.strAccountName.Contains(searchTerm)));
        }

        // Get total count
        var totalCount = await query.CountAsync();

        // Apply sorting — use allowlist to prevent crashes on derived DTO-only fields
        if (!string.IsNullOrWhiteSpace(filter.SortBy))
        {
            var sortKey = filter.SortBy.Trim().ToLowerInvariant();
            query = sortKey switch
            {
                "strfirstname" => filter.Ascending ? query.OrderBy(c => c.strFirstName) : query.OrderByDescending(c => c.strFirstName),
                "strlastname" => filter.Ascending ? query.OrderBy(c => c.strLastName) : query.OrderByDescending(c => c.strLastName),
                "stremail" => filter.Ascending ? query.OrderBy(c => c.strEmail) : query.OrderByDescending(c => c.strEmail),
                "strphone" => filter.Ascending ? query.OrderBy(c => c.strPhone) : query.OrderByDescending(c => c.strPhone),
                "strjobtitle" => filter.Ascending ? query.OrderBy(c => c.strJobTitle) : query.OrderByDescending(c => c.strJobTitle),
                "strlifecyclestage" => filter.Ascending ? query.OrderBy(c => c.strLifecycleStage) : query.OrderByDescending(c => c.strLifecycleStage),
                "straccountname" => filter.Ascending
                    ? query.OrderBy(c => c.Account != null ? c.Account.strAccountName : null)
                    : query.OrderByDescending(c => c.Account != null ? c.Account.strAccountName : null),
                "strassignedtoguid" => filter.Ascending ? query.OrderBy(c => c.strAssignedToGUID) : query.OrderByDescending(c => c.strAssignedToGUID),
                "dtcreatedon" => filter.Ascending ? query.OrderBy(c => c.dtCreatedOn) : query.OrderByDescending(c => c.dtCreatedOn),
                "bolisactive" => filter.Ascending ? query.OrderBy(c => c.bolIsActive) : query.OrderByDescending(c => c.bolIsActive),
                _ => query.OrderByDescending(c => c.dtCreatedOn)
            };

            if (sortKey is "strassignedtoname")
            {
                // strAssignedToName is enriched post-query; fall back to dtCreatedOn
                _logger.LogWarning("SortBy '{SortBy}' is a derived field for contacts; falling back to dtCreatedOn.", filter.SortBy);
            }
        }
        else
        {
            query = query.OrderByDescending(c => c.dtCreatedOn);
        }

        // Project to DTO at DB level — only fetches needed columns, no full entity loading
        var contactDtos = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(c => new ContactListDto
            {
                strContactGUID = c.strContactGUID,
                strFirstName = c.strFirstName,
                strLastName = c.strLastName,
                strEmail = c.strEmail,
                strPhone = c.strPhone,
                strJobTitle = c.strJobTitle,
                strAccountName = c.Account != null ? c.Account.strAccountName : null,
                strLifecycleStage = c.strLifecycleStage,
                strAssignedToGUID = c.strAssignedToGUID,
                dtCreatedOn = c.dtCreatedOn,
                bolIsActive = c.bolIsActive
            })
            .ToListAsync();

        // Enrich assigned-to user names
        var assignedUserIds = contactDtos
            .Where(c => c.strAssignedToGUID.HasValue)
            .Select(c => c.strAssignedToGUID!.Value)
            .Distinct()
            .ToList();
        if (assignedUserIds.Count > 0)
        {
            var tenantId = GetTenantId();
            var userNames = await _masterDbContext.MstUsers
                .AsNoTracking()
                .Where(u => u.strGroupGUID == tenantId && assignedUserIds.Contains(u.strUserGUID))
                .Select(u => new { u.strUserGUID, u.strName })
                .ToListAsync();
            var nameById = userNames.ToDictionary(u => u.strUserGUID, u => u.strName);
            foreach (var dto in contactDtos)
            {
                if (dto.strAssignedToGUID.HasValue && nameById.TryGetValue(dto.strAssignedToGUID.Value, out var name))
                    dto.strAssignedToName = name;
            }
        }

        return new PagedResponse<ContactListDto>
        {
            Items = contactDtos,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<ContactDetailDto> GetContactByIdAsync(Guid id)
    {
        var contact = await _unitOfWork.Contacts.Query()
            .AsNoTracking()
            .Where(c => c.strContactGUID == id)
            .Select(c => new ContactDetailDto
            {
                strContactGUID = c.strContactGUID,
                strFirstName = c.strFirstName,
                strLastName = c.strLastName,
                strEmail = c.strEmail,
                strPhone = c.strPhone,
                strJobTitle = c.strJobTitle,
                strAccountName = c.Account != null ? c.Account.strAccountName : null,
                strLifecycleStage = c.strLifecycleStage,
                strAssignedToGUID = c.strAssignedToGUID,
                dtCreatedOn = c.dtCreatedOn,
                bolIsActive = c.bolIsActive,
                strAccountGUID = c.strAccountGUID,
                strMobilePhone = c.strMobilePhone,
                strDepartment = c.strDepartment,
                strAddress = c.strAddress,
                strCity = c.strCity,
                strState = c.strState,
                strCountry = c.strCountry,
                strPostalCode = c.strPostalCode,
                strNotes = c.strNotes,
                dtLastContactedOn = c.dtLastContactedOn
            })
            .FirstOrDefaultAsync();

        if (contact == null)
            throw new NotFoundException("Contact not found", ContactErrorCodes.ContactNotFound);

        var opportunities = await _unitOfWork.OpportunityContacts.Query()
            .AsNoTracking()
            .Where(oc => oc.strContactGUID == id)
            .OrderByDescending(oc => oc.Opportunity.dtCreatedOn)
            .Select(oc => new OpportunityListDto
            {
                strOpportunityGUID = oc.Opportunity.strOpportunityGUID,
                strOpportunityName = oc.Opportunity.strOpportunityName,
                strAccountName = oc.Opportunity.Account != null ? oc.Opportunity.Account.strAccountName : null,
                strStageName = oc.Opportunity.Stage != null ? oc.Opportunity.Stage.strStageName : string.Empty,
                strStatus = oc.Opportunity.strStatus,
                dblAmount = oc.Opportunity.dblAmount,
                strCurrency = oc.Opportunity.strCurrency,
                intProbability = oc.Opportunity.intProbability,
                dtExpectedCloseDate = oc.Opportunity.dtExpectedCloseDate,
                bolIsRotting = oc.Opportunity.strStatus == "Open"
                    && oc.Opportunity.Stage != null
                    && !oc.Opportunity.Stage.bolIsWonStage
                    && !oc.Opportunity.Stage.bolIsLostStage
                    && oc.Opportunity.Stage.intDefaultDaysToRot > 0
                    && (
                        EF.Functions.DateDiffDay(oc.Opportunity.dtStageEnteredOn, DateTime.UtcNow) > oc.Opportunity.Stage.intDefaultDaysToRot
                        || (oc.Opportunity.dtLastActivityOn != null
                            && EF.Functions.DateDiffDay(oc.Opportunity.dtLastActivityOn.Value, DateTime.UtcNow) > oc.Opportunity.Stage.intDefaultDaysToRot)
                        || (oc.Opportunity.dtLastActivityOn == null
                            && EF.Functions.DateDiffDay(oc.Opportunity.dtStageEnteredOn, DateTime.UtcNow) > oc.Opportunity.Stage.intDefaultDaysToRot)
                    ),
                strAssignedToGUID = oc.Opportunity.strAssignedToGUID,
                dtCreatedOn = oc.Opportunity.dtCreatedOn,
                bolIsActive = oc.Opportunity.bolIsActive
            })
            .ToListAsync();

        // Load activities with graceful fallback for schema mismatch
        var activities = new List<ActivityListDto>();
        try
        {
            activities = await _unitOfWork.ActivityLinks.Query()
                .AsNoTracking()
                .Where(al => al.strEntityType == EntityTypeConstants.Contact
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
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 207)
        {
            // Column not found - database schema mismatch, return empty list
            activities = new List<ActivityListDto>();
        }

        contact.Opportunities = opportunities;
        contact.RecentActivities = activities;

        // Enrich activity user names
        await ActivityDtoEnricher.PopulateUserNamesAsync(_masterDbContext, GetTenantId(), activities);

        // Resolve assigned-to user name for the contact itself
        if (contact.strAssignedToGUID.HasValue)
        {
            contact.strAssignedToName = await _masterDbContext.MstUsers
                .AsNoTracking()
                .Where(u => u.strGroupGUID == GetTenantId() && u.strUserGUID == contact.strAssignedToGUID.Value)
                .Select(u => u.strName)
                .FirstOrDefaultAsync();
        }

        return contact;
    }

    public async Task<ContactDetailDto> CreateContactAsync(CreateContactDto dto)
    {
        // Normalize data
        var normalizedEmail = DataNormalizationHelper.NormalizeEmail(dto.strEmail);

        // Check for duplicate email
        var existingContact = await _unitOfWork.Contacts.GetByEmailAsync(normalizedEmail, GetTenantId());
        if (existingContact != null)
            throw new BusinessException("A contact with this email already exists", ContactErrorCodes.DuplicateEmail);

        // Validate account exists if provided
        if (dto.strAccountGUID.HasValue)
        {
            var account = await _unitOfWork.Accounts.GetByIdAsync(dto.strAccountGUID.Value);
            if (account == null)
                throw new NotFoundException("Account not found", ContactErrorCodes.AccountNotFound);
        }

        // Validate lifecycle stage if provided
        var lifecycleStage = dto.strLifecycleStage ?? ContactLifecycleStageConstants.Subscriber;
        _contactService.ValidateLifecycleStageTransition(ContactLifecycleStageConstants.Subscriber, lifecycleStage);

        var contact = new MstContact
        {
            strContactGUID = Guid.NewGuid(),
            strGroupGUID = GetTenantId(),
            strAccountGUID = dto.strAccountGUID,
            strFirstName = dto.strFirstName.Trim(),
            strLastName = dto.strLastName.Trim(),
            strEmail = normalizedEmail,
            strPhone = DataNormalizationHelper.NormalizePhone(dto.strPhone),
            strMobilePhone = DataNormalizationHelper.NormalizePhone(dto.strMobilePhone),
            strJobTitle = DataNormalizationHelper.TrimOrNull(dto.strJobTitle),
            strDepartment = DataNormalizationHelper.TrimOrNull(dto.strDepartment),
            strLifecycleStage = lifecycleStage,
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

        await _unitOfWork.Contacts.AddAsync(contact);
        await _unitOfWork.SaveChangesAsync();

        // Audit log
        await _auditLogService.LogAsync(
            EntityTypeConstants.Contact,
            contact.strContactGUID,
            "Create",
            JsonSerializer.Serialize(new { dto.strFirstName, dto.strLastName, dto.strEmail }),
            GetCurrentUserId());

        _logger.LogInformation("Contact created: {ContactGUID} by {UserGUID}", contact.strContactGUID, GetCurrentUserId());

        return await GetContactByIdAsync(contact.strContactGUID);
    }

    public async Task<ContactDetailDto> UpdateContactAsync(Guid id, UpdateContactDto dto)
    {
        var contact = await _unitOfWork.Contacts.Query()
            .FirstOrDefaultAsync(c => c.strContactGUID == id);

        if (contact == null)
            throw new NotFoundException("Contact not found", ContactErrorCodes.ContactNotFound);

        // Normalize and check email uniqueness if changed
        var normalizedEmail = DataNormalizationHelper.NormalizeEmail(dto.strEmail);
        if (normalizedEmail != contact.strEmail.ToLowerInvariant())
        {
            var existingContact = await _unitOfWork.Contacts.GetByEmailAsync(normalizedEmail, GetTenantId());
            if (existingContact != null && existingContact.strContactGUID != id)
                throw new BusinessException("A contact with this email already exists", ContactErrorCodes.DuplicateEmail);
        }

        // Validate account exists if provided
        if (dto.strAccountGUID.HasValue)
        {
            var account = await _unitOfWork.Accounts.GetByIdAsync(dto.strAccountGUID.Value);
            if (account == null)
                throw new NotFoundException("Account not found", ContactErrorCodes.AccountNotFound);
        }

        // Validate lifecycle stage transition if changed
        var newLifecycleStage = dto.strLifecycleStage ?? contact.strLifecycleStage;
        if (newLifecycleStage != contact.strLifecycleStage)
            _contactService.ValidateLifecycleStageTransition(contact.strLifecycleStage, newLifecycleStage);

        // Capture old values for audit
        var oldValues = JsonSerializer.Serialize(new { contact.strFirstName, contact.strLastName, contact.strEmail, contact.strLifecycleStage });

        // Update fields
        contact.strAccountGUID = dto.strAccountGUID;
        contact.strFirstName = dto.strFirstName.Trim();
        contact.strLastName = dto.strLastName.Trim();
        contact.strEmail = normalizedEmail;
        contact.strPhone = DataNormalizationHelper.NormalizePhone(dto.strPhone);
        contact.strMobilePhone = DataNormalizationHelper.NormalizePhone(dto.strMobilePhone);
        contact.strJobTitle = DataNormalizationHelper.TrimOrNull(dto.strJobTitle);
        contact.strDepartment = DataNormalizationHelper.TrimOrNull(dto.strDepartment);
        contact.strLifecycleStage = newLifecycleStage;
        contact.strAddress = DataNormalizationHelper.TrimOrNull(dto.strAddress);
        contact.strCity = DataNormalizationHelper.TrimOrNull(dto.strCity);
        contact.strState = DataNormalizationHelper.TrimOrNull(dto.strState);
        contact.strCountry = DataNormalizationHelper.TrimOrNull(dto.strCountry);
        contact.strPostalCode = DataNormalizationHelper.TrimOrNull(dto.strPostalCode);
        contact.strNotes = DataNormalizationHelper.TrimOrNull(dto.strNotes);
        contact.strAssignedToGUID = dto.strAssignedToGUID;
        contact.strUpdatedByGUID = GetCurrentUserId();
        contact.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.Contacts.Update(contact);
        await _unitOfWork.SaveChangesAsync();

        // Audit log
        var newValues = JsonSerializer.Serialize(new { dto.strFirstName, dto.strLastName, dto.strEmail, dto.strLifecycleStage });
        await _auditLogService.LogAsync(
            EntityTypeConstants.Contact,
            contact.strContactGUID,
            "Update",
            JsonSerializer.Serialize(new { Old = oldValues, New = newValues }),
            GetCurrentUserId());

        return await GetContactByIdAsync(contact.strContactGUID);
    }

    public async Task<bool> DeleteContactAsync(Guid id)
    {
        var contact = await _unitOfWork.Contacts.GetByIdAsync(id);
        if (contact == null)
            throw new NotFoundException("Contact not found", ContactErrorCodes.ContactNotFound);

        // Soft delete
        contact.bolIsDeleted = true;
        contact.bolIsActive = false;
        contact.dtDeletedOn = DateTime.UtcNow;
        contact.strUpdatedByGUID = GetCurrentUserId();
        contact.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.Contacts.Update(contact);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(
            EntityTypeConstants.Contact,
            contact.strContactGUID,
            "Delete",
            null,
            GetCurrentUserId());

        return true;
    }

    public async Task<bool> BulkArchiveAsync(ContactBulkArchiveDto dto)
    {
        // Single batch query instead of N+1 individual fetches
        var contacts = await _unitOfWork.Contacts.Query()
            .Where(c => dto.Guids.Contains(c.strContactGUID))
            .ToListAsync();

        var now = DateTime.UtcNow;
        var userId = GetCurrentUserId();

        foreach (var contact in contacts)
        {
            contact.bolIsActive = false;
            contact.strUpdatedByGUID = userId;
            contact.dtUpdatedOn = now;
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> BulkRestoreAsync(ContactBulkArchiveDto dto)
    {
        // Single batch query instead of N+1 individual fetches
        var contacts = await _unitOfWork.Contacts.Query()
            .Where(c => dto.Guids.Contains(c.strContactGUID))
            .ToListAsync();

        var now = DateTime.UtcNow;
        var userId = GetCurrentUserId();

        foreach (var contact in contacts)
        {
            contact.bolIsActive = true;
            contact.strUpdatedByGUID = userId;
            contact.dtUpdatedOn = now;
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    // === Mapping Methods ===

    private static ContactDetailDto MapToDetailDto(MstContact contact, string? accountName = null)
    {
        return new ContactDetailDto
        {
            strContactGUID = contact.strContactGUID,
            strFirstName = contact.strFirstName,
            strLastName = contact.strLastName,
            strEmail = contact.strEmail,
            strPhone = contact.strPhone,
            strJobTitle = contact.strJobTitle,
            strAccountName = accountName ?? contact.Account?.strAccountName,
            strLifecycleStage = contact.strLifecycleStage,
            strAssignedToGUID = contact.strAssignedToGUID,
            dtCreatedOn = contact.dtCreatedOn,
            bolIsActive = contact.bolIsActive,
            strAccountGUID = contact.strAccountGUID,
            strMobilePhone = contact.strMobilePhone,
            strDepartment = contact.strDepartment,
            strAddress = contact.strAddress,
            strCity = contact.strCity,
            strState = contact.strState,
            strCountry = contact.strCountry,
            strPostalCode = contact.strPostalCode,
            strNotes = contact.strNotes,
            dtLastContactedOn = contact.dtLastContactedOn,
            Opportunities = new List<OpportunityListDto>(),
            RecentActivities = new List<ActivityListDto>()
        };
    }
}
