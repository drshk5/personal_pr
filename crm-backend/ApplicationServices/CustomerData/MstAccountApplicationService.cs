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

public class MstAccountApplicationService : ApplicationServiceBase, IMstAccountApplicationService
{
    private readonly IAccountService _accountService;
    private readonly IAuditLogService _auditLogService;

    public MstAccountApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        IAccountService accountService,
        IAuditLogService auditLogService,
        ILogger<MstAccountApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _accountService = accountService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResponse<AccountListDto>> GetAccountsAsync(AccountFilterParams filter)
    {
        var query = _unitOfWork.Accounts.Query().AsNoTracking();

        // Apply filters
        if (filter.bolIsActive.HasValue)
            query = query.Where(a => a.bolIsActive == filter.bolIsActive.Value);

        if (!string.IsNullOrWhiteSpace(filter.strIndustry))
            query = query.Where(a => a.strIndustry == filter.strIndustry);

        if (filter.strAssignedToGUID.HasValue)
            query = query.Where(a => a.strAssignedToGUID == filter.strAssignedToGUID.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.ToLower().Trim();
            query = query.Where(a =>
                a.strAccountName.ToLower().Contains(searchTerm) ||
                (a.strEmail != null && a.strEmail.ToLower().Contains(searchTerm)) ||
                (a.strPhone != null && a.strPhone.Contains(searchTerm)) ||
                (a.strIndustry != null && a.strIndustry.ToLower().Contains(searchTerm)) ||
                (a.strCity != null && a.strCity.ToLower().Contains(searchTerm)) ||
                (a.strCountry != null && a.strCountry.ToLower().Contains(searchTerm)));
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
            query = query.OrderByDescending(a => a.dtCreatedOn);
        }

        // Single server-side projection query — NO N+1
        // SQL Server computes counts + sum in ONE round trip via correlated subqueries
        var accountDtos = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(a => new AccountListDto
            {
                strAccountGUID = a.strAccountGUID,
                strAccountName = a.strAccountName,
                strIndustry = a.strIndustry,
                strPhone = a.strPhone,
                strEmail = a.strEmail,
                intContactCount = a.Contacts.Count(),
                intOpenOpportunityCount = a.Opportunities.Count(o => o.strStatus == "Open"),
                dblTotalOpportunityValue = a.Opportunities
                    .Where(o => o.strStatus == "Open")
                    .Sum(o => (decimal?)o.dblAmount ?? 0),
                strAssignedToGUID = a.strAssignedToGUID,
                dtCreatedOn = a.dtCreatedOn,
                bolIsActive = a.bolIsActive
            })
            .ToListAsync();

        return new PagedResponse<AccountListDto>
        {
            Items = accountDtos,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<AccountDetailDto> GetAccountByIdAsync(Guid id)
    {
        // Single query — project only the columns needed for the account itself
        var account = await _unitOfWork.Accounts.Query()
            .AsNoTracking()
            .Where(a => a.strAccountGUID == id)
            .Select(a => new
            {
                a.strAccountGUID,
                a.strAccountName,
                a.strIndustry,
                a.strPhone,
                a.strEmail,
                a.strWebsite,
                a.intEmployeeCount,
                a.dblAnnualRevenue,
                a.strAddress,
                a.strCity,
                a.strState,
                a.strCountry,
                a.strPostalCode,
                a.strDescription,
                a.strAssignedToGUID,
                a.dtCreatedOn,
                a.bolIsActive
            })
            .FirstOrDefaultAsync();

        if (account == null)
            throw new NotFoundException("Account not found", "ACCOUNT_NOT_FOUND");

        // Store account name in a local variable to use in subsequent queries
        var accountName = account.strAccountName;

        // Run queries sequentially because scoped DbContext cannot execute concurrent operations safely
        var contacts = await _unitOfWork.Contacts.Query()
            .AsNoTracking()
            .Where(c => c.strAccountGUID == id)
            .OrderByDescending(c => c.dtCreatedOn)
            .Select(c => new ContactListDto
            {
                strContactGUID = c.strContactGUID,
                strFirstName = c.strFirstName,
                strLastName = c.strLastName,
                strEmail = c.strEmail,
                strPhone = c.strPhone,
                strJobTitle = c.strJobTitle,
                strAccountName = accountName,
                strLifecycleStage = c.strLifecycleStage,
                strAssignedToGUID = c.strAssignedToGUID,
                dtCreatedOn = c.dtCreatedOn,
                bolIsActive = c.bolIsActive
            })
            .ToListAsync();

        var opportunities = await _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Include(o => o.Stage)
            .Where(o => o.strAccountGUID == id)
            .OrderByDescending(o => o.dtCreatedOn)
            .Select(o => new OpportunityListDto
            {
                strOpportunityGUID = o.strOpportunityGUID,
                strOpportunityName = o.strOpportunityName,
                strAccountName = accountName,
                strStageName = o.Stage != null ? o.Stage.strStageName : string.Empty,
                strStatus = o.strStatus,
                dblAmount = o.dblAmount,
                strCurrency = o.strCurrency,
                intProbability = o.intProbability,
                dtExpectedCloseDate = o.dtExpectedCloseDate,
                bolIsRotting = o.Stage != null
                    && !o.Stage.bolIsWonStage
                    && !o.Stage.bolIsLostStage
                    && o.Stage.intDefaultDaysToRot > 0
                    && (
                        EF.Functions.DateDiffDay(o.dtStageEnteredOn, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot
                        || (o.dtLastActivityOn != null
                            && EF.Functions.DateDiffDay(o.dtLastActivityOn.Value, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot)
                        || (o.dtLastActivityOn == null
                            && EF.Functions.DateDiffDay(o.dtStageEnteredOn, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot)
                    ),
                strAssignedToGUID = o.strAssignedToGUID,
                dtCreatedOn = o.dtCreatedOn
            })
            .ToListAsync();

        // Load activities with graceful fallback for schema mismatch
        var activities = new List<ActivityListDto>();
        try
        {
            activities = await _unitOfWork.ActivityLinks.Query()
                .AsNoTracking()
                .Where(al => al.strEntityType == EntityTypeConstants.Account
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

        var openOpps = opportunities.Where(o => o.strStatus == "Open").ToList();

        // Get all activities for the account (not just recent) with schema mismatch fallback
        var allActivities = new List<ActivityListDto>();
        try
        {
            allActivities = await _unitOfWork.ActivityLinks.Query()
                .AsNoTracking()
                .Where(al => al.strEntityType == EntityTypeConstants.Account
                    && al.strEntityGUID == id)
                .OrderByDescending(al => al.Activity.dtCreatedOn)
                .Select(al => new ActivityListDto
                {
                    strActivityGUID = al.Activity.strActivityGUID,
                    strActivityType = al.Activity.strActivityType,
                    strSubject = al.Activity.strSubject,
                    strDescription = al.Activity.strDescription,
                    dtScheduledOn = al.Activity.dtScheduledOn,
                    dtCompletedOn = al.Activity.dtCompletedOn,
                    intDurationMinutes = al.Activity.intDurationMinutes,
                    strOutcome = al.Activity.strOutcome,
                    strStatus = al.Activity.strStatus,
                    strPriority = al.Activity.strPriority,
                    dtDueDate = al.Activity.dtDueDate,
                    strCategory = al.Activity.strCategory,
                    bolIsOverdue = al.Activity.dtDueDate.HasValue && al.Activity.dtDueDate.Value < DateTime.UtcNow
                                  && al.Activity.strStatus != ActivityStatusConstants.Completed
                                  && al.Activity.strStatus != ActivityStatusConstants.Cancelled,
                    strAssignedToGUID = al.Activity.strAssignedToGUID,
                    strAssignedToName = null,
                    strCreatedByGUID = al.Activity.strCreatedByGUID,
                    strCreatedByName = string.Empty,
                    dtCreatedOn = al.Activity.dtCreatedOn,
                    dtUpdatedOn = al.Activity.dtUpdatedOn,
                    bolIsActive = al.Activity.bolIsActive,
                    Links = new List<ActivityLinkDto>()
                })
                .ToListAsync();
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 207)
        {
            // Column not found - database schema mismatch, return empty list
            allActivities = new List<ActivityListDto>();
        }

        var now = DateTime.UtcNow;
        var overdueCount = allActivities.Count(a => a.bolIsOverdue);
        var lastActivityDate = allActivities.FirstOrDefault()?.dtCreatedOn;

        // Get timeline
        var timeline = await GetAccountTimelineAsync(id);

        return new AccountDetailDto
        {
            strAccountGUID = account.strAccountGUID,
            strAccountName = account.strAccountName,
            strIndustry = account.strIndustry,
            strPhone = account.strPhone,
            strEmail = account.strEmail,
            intContactCount = contacts.Count,
            intOpenOpportunityCount = openOpps.Count,
            dblTotalOpportunityValue = openOpps.Sum(o => o.dblAmount ?? 0),
            strAssignedToGUID = account.strAssignedToGUID,
            dtCreatedOn = account.dtCreatedOn,
            bolIsActive = account.bolIsActive,
            strWebsite = account.strWebsite,
            intEmployeeCount = account.intEmployeeCount,
            dblAnnualRevenue = account.dblAnnualRevenue,
            strAddress = account.strAddress,
            strCity = account.strCity,
            strState = account.strState,
            strCountry = account.strCountry,
            strPostalCode = account.strPostalCode,
            strDescription = account.strDescription,
            intActivityCount = allActivities.Count,
            intOverdueActivityCount = overdueCount,
            dtLastActivityOn = lastActivityDate,
            Contacts = contacts,
            Opportunities = opportunities,
            RecentActivities = activities,
            AllActivities = allActivities,
            Timeline = timeline
        };
    }

    public async Task<AccountDetailDto> CreateAccountAsync(CreateAccountDto dto)
    {
        _accountService.ValidateAccountName(dto.strAccountName);

        // AnyAsync — returns bool, no entity materialization
        var nameExists = await _unitOfWork.Accounts.Query()
            .AnyAsync(a => a.strAccountName.ToLower() == dto.strAccountName.Trim().ToLower());

        if (nameExists)
            throw new BusinessException("An account with this name already exists", "ACCOUNT_DUPLICATE_NAME");

        var account = new MstAccount
        {
            strAccountGUID = Guid.NewGuid(),
            strGroupGUID = GetTenantId(),
            strAccountName = dto.strAccountName.Trim(),
            strIndustry = DataNormalizationHelper.TrimOrNull(dto.strIndustry),
            strWebsite = DataNormalizationHelper.TrimOrNull(dto.strWebsite),
            strPhone = DataNormalizationHelper.NormalizePhone(dto.strPhone),
            strEmail = dto.strEmail != null ? DataNormalizationHelper.NormalizeEmail(dto.strEmail) : null,
            intEmployeeCount = dto.intEmployeeCount,
            dblAnnualRevenue = dto.dblAnnualRevenue,
            strAddress = DataNormalizationHelper.TrimOrNull(dto.strAddress),
            strCity = DataNormalizationHelper.TrimOrNull(dto.strCity),
            strState = DataNormalizationHelper.TrimOrNull(dto.strState),
            strCountry = DataNormalizationHelper.TrimOrNull(dto.strCountry),
            strPostalCode = DataNormalizationHelper.TrimOrNull(dto.strPostalCode),
            strDescription = DataNormalizationHelper.TrimOrNull(dto.strDescription),
            strAssignedToGUID = dto.strAssignedToGUID,
            strCreatedByGUID = GetCurrentUserId(),
            dtCreatedOn = DateTime.UtcNow,
            bolIsActive = true,
            bolIsDeleted = false
        };

        await _unitOfWork.Accounts.AddAsync(account);
        await _unitOfWork.SaveChangesAsync();

        // Audit log
        await _auditLogService.LogAsync(
            EntityTypeConstants.Account,
            account.strAccountGUID,
            "Create",
            JsonSerializer.Serialize(new { dto.strAccountName, dto.strIndustry, dto.strEmail }),
            GetCurrentUserId());

        _logger.LogInformation("Account created: {AccountGUID} by {UserGUID}", account.strAccountGUID, GetCurrentUserId());

        return await GetAccountByIdAsync(account.strAccountGUID);
    }

    public async Task<AccountDetailDto> UpdateAccountAsync(Guid id, UpdateAccountDto dto)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(id);
        if (account == null)
            throw new NotFoundException("Account not found", "ACCOUNT_NOT_FOUND");

        _accountService.ValidateAccountName(dto.strAccountName);

        // AnyAsync — only check if name changed
        if (dto.strAccountName.Trim().ToLower() != account.strAccountName.ToLower())
        {
            var nameExists = await _unitOfWork.Accounts.Query()
                .AnyAsync(a => a.strAccountName.ToLower() == dto.strAccountName.Trim().ToLower()
                    && a.strAccountGUID != id);

            if (nameExists)
                throw new BusinessException("An account with this name already exists", "ACCOUNT_DUPLICATE_NAME");
        }

        // Capture old values for audit
        var oldValues = JsonSerializer.Serialize(new
        {
            account.strAccountName,
            account.strIndustry,
            account.strEmail,
            account.strPhone,
            account.strWebsite
        });

        // Update fields
        account.strAccountName = dto.strAccountName.Trim();
        account.strIndustry = DataNormalizationHelper.TrimOrNull(dto.strIndustry);
        account.strWebsite = DataNormalizationHelper.TrimOrNull(dto.strWebsite);
        account.strPhone = DataNormalizationHelper.NormalizePhone(dto.strPhone);
        account.strEmail = dto.strEmail != null ? DataNormalizationHelper.NormalizeEmail(dto.strEmail) : null;
        account.intEmployeeCount = dto.intEmployeeCount;
        account.dblAnnualRevenue = dto.dblAnnualRevenue;
        account.strAddress = DataNormalizationHelper.TrimOrNull(dto.strAddress);
        account.strCity = DataNormalizationHelper.TrimOrNull(dto.strCity);
        account.strState = DataNormalizationHelper.TrimOrNull(dto.strState);
        account.strCountry = DataNormalizationHelper.TrimOrNull(dto.strCountry);
        account.strPostalCode = DataNormalizationHelper.TrimOrNull(dto.strPostalCode);
        account.strDescription = DataNormalizationHelper.TrimOrNull(dto.strDescription);
        account.strAssignedToGUID = dto.strAssignedToGUID;
        account.strUpdatedByGUID = GetCurrentUserId();
        account.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.Accounts.Update(account);
        await _unitOfWork.SaveChangesAsync();

        // Audit log
        var newValues = JsonSerializer.Serialize(new
        {
            dto.strAccountName,
            dto.strIndustry,
            dto.strEmail,
            dto.strPhone,
            dto.strWebsite
        });
        await _auditLogService.LogAsync(
            EntityTypeConstants.Account,
            account.strAccountGUID,
            "Update",
            JsonSerializer.Serialize(new { Old = oldValues, New = newValues }),
            GetCurrentUserId());

        return await GetAccountByIdAsync(account.strAccountGUID);
    }

    public async Task<bool> DeleteAccountAsync(Guid id)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(id);
        if (account == null)
            throw new NotFoundException("Account not found", "ACCOUNT_NOT_FOUND");

        // Sequential counts to avoid concurrent operations on shared DbContext
        var contactCount = await _unitOfWork.Contacts.Query()
            .CountAsync(c => c.strAccountGUID == id);

        var openOppCount = await _unitOfWork.Opportunities.Query()
            .CountAsync(o => o.strAccountGUID == id && o.strStatus == "Open");

        _accountService.ValidateForDeletion(account, contactCount, openOppCount);

        // Soft delete
        account.bolIsDeleted = true;
        account.bolIsActive = false;
        account.dtDeletedOn = DateTime.UtcNow;
        account.strUpdatedByGUID = GetCurrentUserId();
        account.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.Accounts.Update(account);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(
            EntityTypeConstants.Account,
            account.strAccountGUID,
            "Delete",
            null,
            GetCurrentUserId());

        return true;
    }

    public async Task<bool> BulkArchiveAsync(AccountBulkArchiveDto dto)
    {
        // Single batch query — load all accounts at once instead of N+1
        var accounts = await _unitOfWork.Accounts.Query()
            .Where(a => dto.Guids.Contains(a.strAccountGUID))
            .ToListAsync();

        var userId = GetCurrentUserId();
        var now = DateTime.UtcNow;

        foreach (var account in accounts)
        {
            account.bolIsActive = false;
            account.strUpdatedByGUID = userId;
            account.dtUpdatedOn = now;
            _unitOfWork.Accounts.Update(account);
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> BulkRestoreAsync(AccountBulkArchiveDto dto)
    {
        // Single batch query — load all accounts at once instead of N+1
        var accounts = await _unitOfWork.Accounts.Query()
            .Where(a => dto.Guids.Contains(a.strAccountGUID))
            .ToListAsync();

        var userId = GetCurrentUserId();
        var now = DateTime.UtcNow;

        foreach (var account in accounts)
        {
            account.bolIsActive = true;
            account.strUpdatedByGUID = userId;
            account.dtUpdatedOn = now;
            _unitOfWork.Accounts.Update(account);
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> BulkAssignAsync(BulkAssignDto dto)
    {
        if (dto.Guids.Count == 0)
            return true;

        var accounts = await _unitOfWork.Accounts.Query()
            .Where(a => dto.Guids.Contains(a.strAccountGUID))
            .ToListAsync();

        var userId = GetCurrentUserId();
        var now = DateTime.UtcNow;

        foreach (var account in accounts)
        {
            account.strAssignedToGUID = dto.strAssignedToGUID;
            account.strUpdatedByGUID = userId;
            account.dtUpdatedOn = now;
            _unitOfWork.Accounts.Update(account);
        }

        await _unitOfWork.SaveChangesAsync();
        _logger.LogInformation("Bulk assigned {Count} accounts to {UserId}", accounts.Count, dto.strAssignedToGUID);
        return true;
    }

    public async Task<List<AccountTimelineEntryDto>> GetAccountTimelineAsync(Guid accountId)
    {
        var now = DateTime.UtcNow;
        var timeline = new List<AccountTimelineEntryDto>();

        // Get all activities linked to this account with schema mismatch fallback
        List<MstActivity> activities;
        try
        {
            activities = await _unitOfWork.ActivityLinks.Query()
                .AsNoTracking()
                .Where(al => al.strEntityType == EntityTypeConstants.Account && al.strEntityGUID == accountId)
                .OrderByDescending(al => al.Activity.dtCreatedOn)
                .Select(al => al.Activity)
                .ToListAsync();
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 207)
        {
            // Column not found - database schema mismatch, return empty activity list
            activities = new List<MstActivity>();
        }

        //Add activities to timeline
        foreach (var activity in activities)
        {
            timeline.Add(new AccountTimelineEntryDto
            {
                strEventType = "Activity",
                strDescription = $"{activity.strActivityType}: {activity.strSubject}",
                dtOccurredOn = activity.dtCreatedOn,
                strPerformedByGUID = activity.strCreatedByGUID,
                strPerformedByName = null
            });

            // Add status change events if activity was completed
            if (activity.dtCompletedOn.HasValue)
            {
                timeline.Add(new AccountTimelineEntryDto
                {
                    strEventType = "ActivityCompleted",
                    strDescription = $"Activity completed: {activity.strSubject}",
                    dtOccurredOn = activity.dtCompletedOn.Value,
                    strPerformedByGUID = activity.strUpdatedByGUID,
                    strPerformedByName = null
                });
            }
        }

        // Get opportunities for this account (as related changes)
        var opportunities = await _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Where(o => o.strAccountGUID == accountId)
            .OrderByDescending(o => o.dtUpdatedOn ?? o.dtCreatedOn)
            .Take(50)
            .ToListAsync();

        foreach (var opp in opportunities)
        {
            timeline.Add(new AccountTimelineEntryDto
            {
                strEventType = "Opportunity",
                strDescription = $"Opportunity moved to {opp.strStatus}: {opp.strOpportunityName}",
                dtOccurredOn = opp.dtUpdatedOn ?? opp.dtCreatedOn,
                strPerformedByGUID = null,
                strPerformedByName = null
            });
        }

        // Get contacts added to this account
        var contacts = await _unitOfWork.Contacts.Query()
            .AsNoTracking()
            .Where(c => c.strAccountGUID == accountId)
            .OrderByDescending(c => c.dtCreatedOn)
            .Take(50)
            .ToListAsync();

        foreach (var contact in contacts)
        {
            timeline.Add(new AccountTimelineEntryDto
            {
                strEventType = "ContactAdded",
                strDescription = $"Contact added: {contact.strFirstName} {contact.strLastName}",
                dtOccurredOn = contact.dtCreatedOn,
                strPerformedByGUID = contact.strCreatedByGUID,
                strPerformedByName = null
            });
        }

        // Sort by date descending
        return timeline.OrderByDescending(t => t.dtOccurredOn).ToList();
    }
}
