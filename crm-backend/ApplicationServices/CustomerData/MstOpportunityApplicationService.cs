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

namespace crm_backend.ApplicationServices.CustomerData;

public class MstOpportunityApplicationService : ApplicationServiceBase, IMstOpportunityApplicationService
{
    private readonly MasterDbContext _masterDbContext;
    private readonly IOpportunityService _opportunityService;
    private readonly IAuditLogService _auditLogService;

    public MstOpportunityApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        MasterDbContext masterDbContext,
        IOpportunityService opportunityService,
        IAuditLogService auditLogService,
        ILogger<MstOpportunityApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _masterDbContext = masterDbContext;
        _opportunityService = opportunityService;
        _auditLogService = auditLogService;
    }

    // ────────────────────────────────────────────────────────────────
    // GET LIST — Single projection query, server-side rotting, AsNoTracking
    // ────────────────────────────────────────────────────────────────

    public async Task<PagedResponse<OpportunityListDto>> GetOpportunitiesAsync(OpportunityFilterParams filter)
    {
        var query = _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Include(o => o.Stage)
            .Include(o => o.Account)
            .AsQueryable();

        // ── Filters ──
        if (filter.bolIsActive.HasValue)
            query = query.Where(o => o.bolIsActive == filter.bolIsActive.Value);

        if (!string.IsNullOrWhiteSpace(filter.strStatus))
            query = query.Where(o => o.strStatus == filter.strStatus);

        if (filter.strPipelineGUID.HasValue)
            query = query.Where(o => o.strPipelineGUID == filter.strPipelineGUID.Value);

        if (filter.strStageGUID.HasValue)
            query = query.Where(o => o.strStageGUID == filter.strStageGUID.Value);

        if (filter.strAccountGUID.HasValue)
            query = query.Where(o => o.strAccountGUID == filter.strAccountGUID.Value);

        if (filter.strAssignedToGUID.HasValue)
            query = query.Where(o => o.strAssignedToGUID == filter.strAssignedToGUID.Value);

        if (filter.dblMinAmount.HasValue)
            query = query.Where(o => o.dblAmount >= filter.dblMinAmount.Value);

        if (filter.dblMaxAmount.HasValue)
            query = query.Where(o => o.dblAmount <= filter.dblMaxAmount.Value);

        if (filter.dtFromDate.HasValue)
            query = query.Where(o => o.dtCreatedOn >= filter.dtFromDate.Value);

        if (filter.dtToDate.HasValue)
            query = query.Where(o => o.dtCreatedOn <= filter.dtToDate.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.ToLower().Trim();
            query = query.Where(o =>
                o.strOpportunityName.ToLower().Contains(searchTerm) ||
                (o.Account != null && o.Account.strAccountName.ToLower().Contains(searchTerm)) ||
                (o.Stage != null && o.Stage.strStageName.ToLower().Contains(searchTerm)));
        }

        // ── Rotting filter (server-side computation) ──
        if (filter.bolIsRotting.HasValue && filter.bolIsRotting.Value)
        {
            query = query.Where(o =>
                o.strStatus == "Open"
                && o.Stage != null
                && !o.Stage.bolIsWonStage
                && !o.Stage.bolIsLostStage
                && o.Stage.intDefaultDaysToRot > 0
                && (
                    EF.Functions.DateDiffDay(o.dtStageEnteredOn, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot
                    || (o.dtLastActivityOn != null
                        && EF.Functions.DateDiffDay(o.dtLastActivityOn.Value, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot)
                    || (o.dtLastActivityOn == null
                        && EF.Functions.DateDiffDay(o.dtStageEnteredOn, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot)
                ));
        }

        // ── Count (single query) ──
        var totalCount = await query.CountAsync();

        // ── Sorting ──
        if (!string.IsNullOrWhiteSpace(filter.SortBy))
        {
            // NOTE: Do not pass arbitrary user-provided strings into Dynamic LINQ.
            // Frontend sends DTO column keys (ex: strStageName) that are not entity properties.
            // Use an allow-list mapping to entity fields / navigation properties.
            var sortKey = filter.SortBy.Trim().ToLowerInvariant();

            // Some sort keys come from projected DTO fields (Account/Stage navigation).
            // Others are direct MstOpportunity columns.
            query = sortKey switch
            {
                "stropportunityname" => filter.Ascending
                    ? query.OrderBy(o => o.strOpportunityName)
                    : query.OrderByDescending(o => o.strOpportunityName),

                "straccountname" => filter.Ascending
                    ? query.OrderBy(o => o.Account != null ? o.Account.strAccountName : null)
                    : query.OrderByDescending(o => o.Account != null ? o.Account.strAccountName : null),

                "strstagename" => filter.Ascending
                    ? query.OrderBy(o => o.Stage != null ? o.Stage.strStageName : null)
                    : query.OrderByDescending(o => o.Stage != null ? o.Stage.strStageName : null),

                "strstatus" => filter.Ascending
                    ? query.OrderBy(o => o.strStatus)
                    : query.OrderByDescending(o => o.strStatus),

                "dblamount" => filter.Ascending
                    ? query.OrderBy(o => o.dblAmount)
                    : query.OrderByDescending(o => o.dblAmount),

                "intprobability" => filter.Ascending
                    ? query.OrderBy(o => o.intProbability)
                    : query.OrderByDescending(o => o.intProbability),

                "dtexpectedclosedate" => filter.Ascending
                    ? query.OrderBy(o => o.dtExpectedCloseDate)
                    : query.OrderByDescending(o => o.dtExpectedCloseDate),

                "dtcreatedon" => filter.Ascending
                    ? query.OrderBy(o => o.dtCreatedOn)
                    : query.OrderByDescending(o => o.dtCreatedOn),

                "strassignedtoguid" => filter.Ascending
                    ? query.OrderBy(o => o.strAssignedToGUID)
                    : query.OrderByDescending(o => o.strAssignedToGUID),

                // Sorting by computed "rotting" flag (same logic as projection)
                "bolisrotting" => filter.Ascending
                    ? query.OrderBy(o =>
                        o.strStatus == "Open"
                        && o.Stage != null
                        && !o.Stage.bolIsWonStage
                        && !o.Stage.bolIsLostStage
                        && o.Stage.intDefaultDaysToRot > 0
                        && (
                            EF.Functions.DateDiffDay(o.dtStageEnteredOn, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot
                            || (o.dtLastActivityOn != null
                                && EF.Functions.DateDiffDay(o.dtLastActivityOn.Value, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot)
                            || (o.dtLastActivityOn == null
                                && EF.Functions.DateDiffDay(o.dtStageEnteredOn, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot)
                        ))
                    : query.OrderByDescending(o =>
                        o.strStatus == "Open"
                        && o.Stage != null
                        && !o.Stage.bolIsWonStage
                        && !o.Stage.bolIsLostStage
                        && o.Stage.intDefaultDaysToRot > 0
                        && (
                            EF.Functions.DateDiffDay(o.dtStageEnteredOn, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot
                            || (o.dtLastActivityOn != null
                                && EF.Functions.DateDiffDay(o.dtLastActivityOn.Value, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot)
                            || (o.dtLastActivityOn == null
                                && EF.Functions.DateDiffDay(o.dtStageEnteredOn, DateTime.UtcNow) > o.Stage.intDefaultDaysToRot)
                        )),

                _ => query.OrderByDescending(o => o.dtCreatedOn)
            };

            if (sortKey is not (
                "stropportunityname" or "straccountname" or "strstagename" or "strstatus" or
                "dblamount" or "intprobability" or "dtexpectedclosedate" or "dtcreatedon" or "bolisrotting" or "strassignedtoguid"))
            {
                _logger.LogWarning("Unsupported SortBy '{SortBy}' for opportunities; falling back to dtCreatedOn.", filter.SortBy);
            }
        }
        else
        {
            query = query.OrderByDescending(o => o.dtCreatedOn);
        }

        // ── Single server-side projection — NO N+1, rotting computed in SQL ──
        var opportunityDtos = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(o => new OpportunityListDto
            {
                strOpportunityGUID = o.strOpportunityGUID,
                strOpportunityName = o.strOpportunityName,
                strAccountName = o.Account != null ? o.Account.strAccountName : null,
                strStageName = o.Stage != null ? o.Stage.strStageName : string.Empty,
                strStatus = o.strStatus,
                dblAmount = o.dblAmount,
                strCurrency = o.strCurrency,
                intProbability = o.intProbability,
                dtExpectedCloseDate = o.dtExpectedCloseDate,
                bolIsRotting = o.strStatus == "Open"
                    && o.Stage != null
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
                dtCreatedOn = o.dtCreatedOn,
                bolIsActive = o.bolIsActive
            })
            .ToListAsync();

        // Enrich assigned-to user names for opportunities
        var assignedUserIds = opportunityDtos
            .Where(o => o.strAssignedToGUID.HasValue)
            .Select(o => o.strAssignedToGUID!.Value)
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
            foreach (var dto in opportunityDtos)
            {
                if (dto.strAssignedToGUID.HasValue && nameById.TryGetValue(dto.strAssignedToGUID.Value, out var name))
                    dto.strAssignedToName = name;
            }
        }

        return new PagedResponse<OpportunityListDto>
        {
            Items = opportunityDtos,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    // ────────────────────────────────────────────────────────────────
    // GET DETAIL — Sequential queries (single scoped DbContext)
    // ────────────────────────────────────────────────────────────────

    public async Task<OpportunityDetailDto> GetOpportunityByIdAsync(Guid id)
    {
        // Single projection query for base fields
        var opp = await _unitOfWork.Opportunities.Query()
            .AsNoTracking()
            .Where(o => o.strOpportunityGUID == id)
            .Select(o => new
            {
                o.strOpportunityGUID,
                o.strOpportunityName,
                AccountName = o.Account != null ? o.Account.strAccountName : null,
                o.strAccountGUID,
                o.strPipelineGUID,
                PipelineName = o.Pipeline.strPipelineName,
                o.strStageGUID,
                StageName = o.Stage.strStageName,
                o.strStatus,
                o.dblAmount,
                o.strCurrency,
                o.intProbability,
                o.dtExpectedCloseDate,
                o.dtActualCloseDate,
                o.strLossReason,
                o.strDescription,
                o.dtStageEnteredOn,
                o.dtLastActivityOn,
                o.strAssignedToGUID,
                o.dtCreatedOn,
                o.bolIsActive,
                StageIsWon = o.Stage.bolIsWonStage,
                StageIsLost = o.Stage.bolIsLostStage,
                StageDaysToRot = o.Stage.intDefaultDaysToRot
            })
            .FirstOrDefaultAsync();

        if (opp == null)
            throw new NotFoundException("Opportunity not found", OpportunityErrorCodes.OpportunityNotFound);

        // Run sequentially because scoped DbContext cannot execute concurrent queries
        var contacts = await _unitOfWork.OpportunityContacts.Query()
            .AsNoTracking()
            .Where(oc => oc.strOpportunityGUID == id)
            .Select(oc => new OpportunityContactDto
            {
                strContactGUID = oc.strContactGUID,
                strContactName = oc.Contact.strFirstName + " " + oc.Contact.strLastName,
                strRole = oc.strRole,
                bolIsPrimary = oc.bolIsPrimary
            })
            .ToListAsync();

        // Load activities with graceful fallback for schema mismatch
        var activities = new List<ActivityListDto>();
        try
        {
            activities = await _unitOfWork.ActivityLinks.Query()
                .AsNoTracking()
                .Where(al => al.strEntityType == EntityTypeConstants.Opportunity
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

        // Compute rotting + days in stage
        var daysInStage = (int)(DateTime.UtcNow - opp.dtStageEnteredOn).TotalDays;
        var isRotting = opp.strStatus == "Open"
            && !opp.StageIsWon && !opp.StageIsLost
            && opp.StageDaysToRot > 0
            && (daysInStage > opp.StageDaysToRot
                || (opp.dtLastActivityOn.HasValue
                    && (int)(DateTime.UtcNow - opp.dtLastActivityOn.Value).TotalDays > opp.StageDaysToRot)
                || (!opp.dtLastActivityOn.HasValue && daysInStage > opp.StageDaysToRot));

        // Enrich activity user names
        await ActivityDtoEnricher.PopulateUserNamesAsync(_masterDbContext, GetTenantId(), activities);

        // Resolve assigned-to user name for the opportunity
        string? oppAssignedToName = null;
        if (opp.strAssignedToGUID.HasValue)
        {
            oppAssignedToName = await _masterDbContext.MstUsers
                .AsNoTracking()
                .Where(u => u.strGroupGUID == GetTenantId() && u.strUserGUID == opp.strAssignedToGUID.Value)
                .Select(u => u.strName)
                .FirstOrDefaultAsync();
        }

        return new OpportunityDetailDto
        {
            strOpportunityGUID = opp.strOpportunityGUID,
            strOpportunityName = opp.strOpportunityName,
            strAccountName = opp.AccountName,
            strAccountGUID = opp.strAccountGUID,
            strPipelineGUID = opp.strPipelineGUID,
            strPipelineName = opp.PipelineName,
            strStageGUID = opp.strStageGUID,
            strStageName = opp.StageName,
            strStatus = opp.strStatus,
            dblAmount = opp.dblAmount,
            strCurrency = opp.strCurrency,
            intProbability = opp.intProbability,
            dtExpectedCloseDate = opp.dtExpectedCloseDate,
            dtActualCloseDate = opp.dtActualCloseDate,
            strLossReason = opp.strLossReason,
            strDescription = opp.strDescription,
            dtStageEnteredOn = opp.dtStageEnteredOn,
            dtLastActivityOn = opp.dtLastActivityOn,
            intDaysInStage = daysInStage,
            bolIsRotting = isRotting,
            strAssignedToGUID = opp.strAssignedToGUID,
            strAssignedToName = oppAssignedToName,
            dtCreatedOn = opp.dtCreatedOn,
            bolIsActive = opp.bolIsActive,
            Contacts = contacts,
            RecentActivities = activities
        };
    }

    // ────────────────────────────────────────────────────────────────
    // CREATE — Validate stage, batch insert contacts
    // ────────────────────────────────────────────────────────────────

    public async Task<OpportunityDetailDto> CreateOpportunityAsync(CreateOpportunityDto dto)
    {
        _opportunityService.ValidateOpportunityName(dto.strOpportunityName);
        var tenantId = GetTenantId();
        var normalizedAccountGuid = dto.strAccountGUID.HasValue && dto.strAccountGUID.Value != Guid.Empty
            ? dto.strAccountGUID
            : null;

        if (normalizedAccountGuid.HasValue)
        {
            var accountExists = await _unitOfWork.Accounts.Query()
                .AsNoTracking()
                .AnyAsync(a =>
                    a.strAccountGUID == normalizedAccountGuid.Value &&
                    a.strGroupGUID == tenantId &&
                    !a.bolIsDeleted);

            if (!accountExists)
            {
                _logger.LogWarning(
                    "Ignoring invalid account GUID {AccountGuid} on opportunity create for tenant {TenantId}",
                    normalizedAccountGuid.Value,
                    tenantId);
                normalizedAccountGuid = null;
            }
        }

        // Validate pipeline + stage sequentially to avoid shared DbContext concurrency issues
        var pipelineExists = await _unitOfWork.Pipelines.Query()
            .AsNoTracking()
            .AnyAsync(p => p.strPipelineGUID == dto.strPipelineGUID);

        if (!pipelineExists)
            throw new NotFoundException("Pipeline not found", OpportunityErrorCodes.InvalidStageTransition);

        var stage = await _unitOfWork.PipelineStages.Query()
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.strStageGUID == dto.strStageGUID
                && s.strPipelineGUID == dto.strPipelineGUID);

        if (stage == null)
            throw new NotFoundException("Stage not found in the specified pipeline", OpportunityErrorCodes.InvalidStageTransition);

        var now = DateTime.UtcNow;
        var userId = GetCurrentUserId();

        var opportunity = new MstOpportunity
        {
            strOpportunityGUID = Guid.NewGuid(),
            strGroupGUID = tenantId,
            strOpportunityName = dto.strOpportunityName.Trim(),
            strAccountGUID = normalizedAccountGuid,
            strPipelineGUID = dto.strPipelineGUID,
            strStageGUID = dto.strStageGUID,
            strStatus = "Open",
            dblAmount = dto.dblAmount,
            strCurrency = dto.strCurrency ?? "INR",
            dtExpectedCloseDate = dto.dtExpectedCloseDate,
            intProbability = stage.intProbabilityPercent,
            strDescription = DataNormalizationHelper.TrimOrNull(dto.strDescription),
            strAssignedToGUID = dto.strAssignedToGUID,
            dtStageEnteredOn = now,
            strCreatedByGUID = userId,
            dtCreatedOn = now,
            bolIsActive = true,
            bolIsDeleted = false
        };

        await _unitOfWork.Opportunities.AddAsync(opportunity);

        // Batch insert contacts
        if (dto.Contacts != null && dto.Contacts.Count > 0)
        {
            foreach (var contact in dto.Contacts)
            {
                var oppContact = new MstOpportunityContact
                {
                    strOpportunityContactGUID = Guid.NewGuid(),
                    strOpportunityGUID = opportunity.strOpportunityGUID,
                    strContactGUID = contact.strContactGUID,
                    strRole = contact.strRole ?? "Stakeholder",
                    bolIsPrimary = contact.bolIsPrimary,
                    dtCreatedOn = now
                };
                await _unitOfWork.OpportunityContacts.AddAsync(oppContact);
            }
        }

        await _unitOfWork.SaveChangesAsync();

        // Audit log
        await _auditLogService.LogAsync(
            EntityTypeConstants.Opportunity,
            opportunity.strOpportunityGUID,
            "Create",
            JsonSerializer.Serialize(new { dto.strOpportunityName, dto.strPipelineGUID, dto.strStageGUID, dto.dblAmount }),
            userId);

        _logger.LogInformation("Opportunity created: {OppGUID} by {UserGUID}", opportunity.strOpportunityGUID, userId);

        return await GetOpportunityByIdAsync(opportunity.strOpportunityGUID);
    }

    // ────────────────────────────────────────────────────────────────
    // UPDATE — AnyAsync duplicate check
    // ────────────────────────────────────────────────────────────────

    public async Task<OpportunityDetailDto> UpdateOpportunityAsync(Guid id, UpdateOpportunityDto dto)
    {
        var opportunity = await _unitOfWork.Opportunities.GetByIdAsync(id);
        if (opportunity == null)
            throw new NotFoundException("Opportunity not found", OpportunityErrorCodes.OpportunityNotFound);
        var tenantId = GetTenantId();
        var normalizedAccountGuid = dto.strAccountGUID.HasValue && dto.strAccountGUID.Value != Guid.Empty
            ? dto.strAccountGUID
            : null;

        if (normalizedAccountGuid.HasValue)
        {
            var accountExists = await _unitOfWork.Accounts.Query()
                .AsNoTracking()
                .AnyAsync(a =>
                    a.strAccountGUID == normalizedAccountGuid.Value &&
                    a.strGroupGUID == tenantId &&
                    !a.bolIsDeleted);

            if (!accountExists)
            {
                _logger.LogWarning(
                    "Ignoring invalid account GUID {AccountGuid} on opportunity update {OpportunityId} for tenant {TenantId}",
                    normalizedAccountGuid.Value,
                    id,
                    tenantId);
                normalizedAccountGuid = null;
            }
        }

        _opportunityService.ValidateOpportunityName(dto.strOpportunityName);

        // Validate stage exists
        var stage = await _unitOfWork.PipelineStages.Query()
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.strStageGUID == dto.strStageGUID);

        if (stage == null)
            throw new NotFoundException("Stage not found", OpportunityErrorCodes.InvalidStageTransition);

        // Capture old values for audit
        var oldValues = JsonSerializer.Serialize(new
        {
            opportunity.strOpportunityName,
            opportunity.strStageGUID,
            opportunity.dblAmount,
            opportunity.strStatus
        });

        // Check if stage changed — reset stage entered time
        var stageChanged = opportunity.strStageGUID != dto.strStageGUID;

        // Update fields
        opportunity.strOpportunityName = dto.strOpportunityName.Trim();
        opportunity.strAccountGUID = normalizedAccountGuid;
        opportunity.strStageGUID = dto.strStageGUID;
        opportunity.dblAmount = dto.dblAmount;
        opportunity.strCurrency = dto.strCurrency ?? "INR";
        opportunity.dtExpectedCloseDate = dto.dtExpectedCloseDate;
        opportunity.strDescription = DataNormalizationHelper.TrimOrNull(dto.strDescription);
        opportunity.strAssignedToGUID = dto.strAssignedToGUID;
        opportunity.strUpdatedByGUID = GetCurrentUserId();
        opportunity.dtUpdatedOn = DateTime.UtcNow;

        if (stageChanged)
        {
            opportunity.dtStageEnteredOn = DateTime.UtcNow;
            opportunity.intProbability = stage.intProbabilityPercent;
        }

        _unitOfWork.Opportunities.Update(opportunity);
        await _unitOfWork.SaveChangesAsync();

        // Audit log
        var newValues = JsonSerializer.Serialize(new
        {
            dto.strOpportunityName,
            dto.strStageGUID,
            dto.dblAmount
        });
        await _auditLogService.LogAsync(
            EntityTypeConstants.Opportunity,
            opportunity.strOpportunityGUID,
            "Update",
            JsonSerializer.Serialize(new { Old = oldValues, New = newValues }),
            GetCurrentUserId());

        return await GetOpportunityByIdAsync(opportunity.strOpportunityGUID);
    }

    // ────────────────────────────────────────────────────────────────
    // DELETE — Soft delete
    // ────────────────────────────────────────────────────────────────

    public async Task<bool> DeleteOpportunityAsync(Guid id)
    {
        var opportunity = await _unitOfWork.Opportunities.GetByIdAsync(id);
        if (opportunity == null)
            throw new NotFoundException("Opportunity not found", OpportunityErrorCodes.OpportunityNotFound);

        _opportunityService.ValidateForDeletion(opportunity);

        opportunity.bolIsDeleted = true;
        opportunity.bolIsActive = false;
        opportunity.dtDeletedOn = DateTime.UtcNow;
        opportunity.strUpdatedByGUID = GetCurrentUserId();
        opportunity.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.Opportunities.Update(opportunity);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(
            EntityTypeConstants.Opportunity,
            opportunity.strOpportunityGUID,
            "Delete",
            null,
            GetCurrentUserId());

        return true;
    }

    // ────────────────────────────────────────────────────────────────
    // MOVE STAGE — Fast stage transition with validation
    // ────────────────────────────────────────────────────────────────

    public async Task<OpportunityDetailDto> MoveStageAsync(Guid id, MoveStageDto dto)
    {
        var opportunity = await _unitOfWork.Opportunities.Query()
            .Include(o => o.Stage)
            .FirstOrDefaultAsync(o => o.strOpportunityGUID == id);

        if (opportunity == null)
            throw new NotFoundException("Opportunity not found", OpportunityErrorCodes.OpportunityNotFound);

        if (opportunity.strStatus != "Open")
            throw new BusinessException("Only open opportunities can be moved", OpportunityErrorCodes.AlreadyClosed);

        var targetStage = await _unitOfWork.PipelineStages.Query()
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.strStageGUID == dto.strStageGUID);

        if (targetStage == null)
            throw new NotFoundException("Target stage not found", OpportunityErrorCodes.InvalidStageTransition);

        _opportunityService.ValidateStageTransition(opportunity.Stage, targetStage);

        var oldStageGuid = opportunity.strStageGUID;

        opportunity.strStageGUID = dto.strStageGUID;
        opportunity.intProbability = targetStage.intProbabilityPercent;
        opportunity.dtStageEnteredOn = DateTime.UtcNow;
        opportunity.strUpdatedByGUID = GetCurrentUserId();
        opportunity.dtUpdatedOn = DateTime.UtcNow;

        // ── Auto-close if target stage is Won or Lost ──────────────
        if (targetStage.bolIsWonStage)
        {
            opportunity.strStatus = "Won";
            opportunity.dtActualCloseDate = DateTime.UtcNow;
        }
        else if (targetStage.bolIsLostStage)
        {
            opportunity.strStatus = "Lost";
            opportunity.dtActualCloseDate = DateTime.UtcNow;
            opportunity.strLossReason = dto.strLossReason ?? "Moved to lost stage";
        }

        _unitOfWork.Opportunities.Update(opportunity);

        // ── Auto-sync linked contact lifecycle stages ──────────────
        if (targetStage.bolIsWonStage)
        {
            // Won → move contacts to "Customer"
            await AutoSyncContactLifecycleToCustomerAsync(opportunity.strOpportunityGUID);
        }
        else
        {
            await AutoSyncContactLifecycleStagesAsync(opportunity.strOpportunityGUID, targetStage);
        }

        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(
            EntityTypeConstants.Opportunity,
            opportunity.strOpportunityGUID,
            targetStage.bolIsWonStage ? "CloseWon" : targetStage.bolIsLostStage ? "CloseLost" : "MoveStage",
            JsonSerializer.Serialize(new { OldStageGUID = oldStageGuid, NewStageGUID = dto.strStageGUID, Status = opportunity.strStatus }),
            GetCurrentUserId());

        return await GetOpportunityByIdAsync(opportunity.strOpportunityGUID);
    }

    // ────────────────────────────────────────────────────────────────
    // CLOSE — Won / Lost with validation
    // ────────────────────────────────────────────────────────────────

    public async Task<OpportunityDetailDto> CloseOpportunityAsync(Guid id, CloseOpportunityDto dto)
    {
        var opportunity = await _unitOfWork.Opportunities.GetByIdAsync(id);
        if (opportunity == null)
            throw new NotFoundException("Opportunity not found", OpportunityErrorCodes.OpportunityNotFound);

        _opportunityService.ValidateCloseRequest(opportunity.strStatus, dto);

        opportunity.strStatus = dto.strStatus;
        opportunity.dtActualCloseDate = dto.dtActualCloseDate ?? DateTime.UtcNow;
        opportunity.strUpdatedByGUID = GetCurrentUserId();
        opportunity.dtUpdatedOn = DateTime.UtcNow;

        if (dto.strStatus == "Lost")
            opportunity.strLossReason = dto.strLossReason;

        // Move to Won/Lost stage if exists
        var closingStage = await _unitOfWork.PipelineStages.Query()
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.strPipelineGUID == opportunity.strPipelineGUID
                && (dto.strStatus == "Won" ? s.bolIsWonStage : s.bolIsLostStage));

        if (closingStage != null)
        {
            opportunity.strStageGUID = closingStage.strStageGUID;
            opportunity.intProbability = closingStage.intProbabilityPercent;
            opportunity.dtStageEnteredOn = DateTime.UtcNow;
        }

        _unitOfWork.Opportunities.Update(opportunity);

        // ── Auto-sync linked contact lifecycle stages on close ──────
        if (dto.strStatus == "Won")
        {
            // Won → move contacts to "Customer"
            await AutoSyncContactLifecycleToCustomerAsync(opportunity.strOpportunityGUID);
        }

        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(
            EntityTypeConstants.Opportunity,
            opportunity.strOpportunityGUID,
            "Close",
            JsonSerializer.Serialize(new { dto.strStatus, dto.strLossReason }),
            GetCurrentUserId());

        return await GetOpportunityByIdAsync(opportunity.strOpportunityGUID);
    }

    // ────────────────────────────────────────────────────────────────
    // ADD CONTACT — AnyAsync duplicate check
    // ────────────────────────────────────────────────────────────────

    public async Task<OpportunityDetailDto> AddContactAsync(Guid opportunityId, AddOpportunityContactDto dto)
    {
        var exists = await _unitOfWork.Opportunities.Query()
            .AnyAsync(o => o.strOpportunityGUID == opportunityId);

        if (!exists)
            throw new NotFoundException("Opportunity not found", OpportunityErrorCodes.OpportunityNotFound);

        // Check if contact already linked
        var alreadyLinked = await _unitOfWork.OpportunityContacts.Query()
            .AnyAsync(oc => oc.strOpportunityGUID == opportunityId
                && oc.strContactGUID == dto.strContactGUID);

        if (alreadyLinked)
            throw new BusinessException("Contact is already linked to this opportunity", "OPP_CONTACT_DUPLICATE");

        var oppContact = new MstOpportunityContact
        {
            strOpportunityContactGUID = Guid.NewGuid(),
            strOpportunityGUID = opportunityId,
            strContactGUID = dto.strContactGUID,
            strRole = dto.strRole ?? "Stakeholder",
            bolIsPrimary = dto.bolIsPrimary,
            dtCreatedOn = DateTime.UtcNow
        };

        await _unitOfWork.OpportunityContacts.AddAsync(oppContact);
        await _unitOfWork.SaveChangesAsync();

        return await GetOpportunityByIdAsync(opportunityId);
    }

    // ────────────────────────────────────────────────────────────────
    // REMOVE CONTACT
    // ────────────────────────────────────────────────────────────────

    public async Task<bool> RemoveContactAsync(Guid opportunityId, Guid contactId)
    {
        var oppContact = await _unitOfWork.OpportunityContacts.Query()
            .FirstOrDefaultAsync(oc => oc.strOpportunityGUID == opportunityId
                && oc.strContactGUID == contactId);

        if (oppContact == null)
            throw new NotFoundException("Contact link not found", "OPP_CONTACT_NOT_FOUND");

        _unitOfWork.OpportunityContacts.Delete(oppContact);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    // ────────────────────────────────────────────────────────────────
    // BOARD VIEW — Single query, group by stage, compute totals server-side
    // ULTRA HIGH PERFORMANCE: one round trip to SQL Server
    // ────────────────────────────────────────────────────────────────

    public async Task<List<OpportunityBoardColumnDto>> GetBoardAsync(Guid pipelineId, int takePerStage = 50)
    {
        // Hard cap to protect API + frontend from accidental high-volume payloads.
        // 0 is allowed (summary-only: counts/totals, no cards).
        takePerStage = Math.Clamp(takePerStage, 0, 500);

        // Get all stages for the pipeline in a single query (ordered for stable UI)
        var stages = await _unitOfWork.PipelineStages.Query()
            .AsNoTracking()
            .Where(s => s.strPipelineGUID == pipelineId && s.bolIsActive)
            .OrderBy(s => s.intDisplayOrder)
            .Select(s => new
            {
                s.strStageGUID,
                s.strStageName,
                s.intDisplayOrder,
                s.intProbabilityPercent,
                s.bolIsWonStage,
                s.bolIsLostStage
            })
            .ToListAsync();

        var stageIds = stages.Select(s => s.strStageGUID).ToList();

        // Stage totals (count + value) computed in SQL over the full dataset.
        // IMPORTANT: Do not fetch all opportunities here (high-volume safe).
        var statsByStage = new Dictionary<Guid, (int Count, decimal TotalValue)>();
        if (stageIds.Count > 0)
        {
            var stageStats = await _unitOfWork.Opportunities.Query()
                .AsNoTracking()
                .Where(o => o.strPipelineGUID == pipelineId
                            && o.strStatus == "Open"
                            && o.bolIsActive
                            && stageIds.Contains(o.strStageGUID))
                .GroupBy(o => o.strStageGUID)
                .Select(g => new
                {
                    StageGUID = g.Key,
                    Count = g.Count(),
                    TotalValue = g.Sum(x => x.dblAmount ?? 0)
                })
                .ToListAsync();

            statsByStage = stageStats.ToDictionary(
                x => x.StageGUID,
                x => (Count: x.Count, TotalValue: x.TotalValue));
        }

        // Fetch a limited set of cards per stage to keep payload + UI performant.
        // NOTE: We order by dtStageEnteredOn so recently moved deals show up after drag-and-drop.
        var oppsByStage = new Dictionary<Guid, List<OpportunityListDto>>();
        if (takePerStage > 0)
        {
            foreach (var s in stages)
            {
                var stageOpps = await _unitOfWork.Opportunities.Query()
                    .AsNoTracking()
                    .Where(o => o.strPipelineGUID == pipelineId
                                && o.strStageGUID == s.strStageGUID
                                && o.strStatus == "Open"
                                && o.bolIsActive)
                    .OrderByDescending(o => o.dtStageEnteredOn)
                    .ThenByDescending(o => o.dtCreatedOn)
                    .Take(takePerStage)
                    .Select(o => new OpportunityListDto
                    {
                        strOpportunityGUID = o.strOpportunityGUID,
                        strOpportunityName = o.strOpportunityName,
                        strAccountName = o.Account != null ? o.Account.strAccountName : null,
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
                        dtCreatedOn = o.dtCreatedOn,
                        bolIsActive = o.bolIsActive
                    })
                    .ToListAsync();

                oppsByStage[s.strStageGUID] = stageOpps;
            }
        }

        var columns = stages.Select(s =>
        {
            var stageOpps = oppsByStage.GetValueOrDefault(s.strStageGUID, new List<OpportunityListDto>());
            var stats = statsByStage.GetValueOrDefault(s.strStageGUID, (Count: 0, TotalValue: 0m));
            return new OpportunityBoardColumnDto
            {
                strStageGUID = s.strStageGUID,
                strStageName = s.strStageName,
                intDisplayOrder = s.intDisplayOrder,
                intProbabilityPercent = s.intProbabilityPercent,
                bolIsWonStage = s.bolIsWonStage,
                bolIsLostStage = s.bolIsLostStage,
                Opportunities = stageOpps,
                dblTotalValue = stats.TotalValue,
                intCount = stats.Count
            };
        }).ToList();

        return columns;
    }

    // ────────────────────────────────────────────────────────────────
    // BULK ARCHIVE / RESTORE — Single batch query
    // ────────────────────────────────────────────────────────────────

    public async Task<bool> BulkArchiveAsync(OpportunityBulkArchiveDto dto)
    {
        var opportunities = await _unitOfWork.Opportunities.Query()
            .Where(o => dto.Guids.Contains(o.strOpportunityGUID))
            .ToListAsync();

        var userId = GetCurrentUserId();
        var now = DateTime.UtcNow;

        foreach (var opp in opportunities)
        {
            opp.bolIsActive = false;
            opp.strUpdatedByGUID = userId;
            opp.dtUpdatedOn = now;
            _unitOfWork.Opportunities.Update(opp);
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> BulkRestoreAsync(OpportunityBulkArchiveDto dto)
    {
        var opportunities = await _unitOfWork.Opportunities.Query()
            .Where(o => dto.Guids.Contains(o.strOpportunityGUID))
            .ToListAsync();

        var userId = GetCurrentUserId();
        var now = DateTime.UtcNow;

        foreach (var opp in opportunities)
        {
            opp.bolIsActive = true;
            opp.strUpdatedByGUID = userId;
            opp.dtUpdatedOn = now;
            _unitOfWork.Opportunities.Update(opp);
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    // ────────────────────────────────────────────────────────────────
    // AUTO-SYNC CONTACT LIFECYCLE STAGES
    // Maps pipeline stage probability to contact lifecycle:
    //   0-20%  → Lead,  21-40% → MQL,  41-60% → SQL,
    //   61-80% → Opportunity,  81-100% → Customer
    // Only advances forward (never demotes a contact)
    // ────────────────────────────────────────────────────────────────

    private async Task AutoSyncContactLifecycleStagesAsync(Guid opportunityId, MstPipelineStage targetStage)
    {
        var targetLifecycle = MapProbabilityToLifecycleStage(targetStage.intProbabilityPercent, targetStage.bolIsWonStage);

        var linkedContactIds = await _unitOfWork.OpportunityContacts.Query()
            .AsNoTracking()
            .Where(oc => oc.strOpportunityGUID == opportunityId)
            .Select(oc => oc.strContactGUID)
            .ToListAsync();

        if (linkedContactIds.Count == 0) return;

        var contacts = await _unitOfWork.Contacts.Query()
            .Where(c => linkedContactIds.Contains(c.strContactGUID))
            .ToListAsync();

        var allStages = ContactLifecycleStageConstants.AllStages;
        var targetIdx = Array.IndexOf(allStages, targetLifecycle);

        foreach (var contact in contacts)
        {
            var currentIdx = Array.IndexOf(allStages, contact.strLifecycleStage);
            // Only advance forward, never demote
            if (targetIdx > currentIdx)
            {
                contact.strLifecycleStage = targetLifecycle;
                contact.dtUpdatedOn = DateTime.UtcNow;
                contact.strUpdatedByGUID = GetCurrentUserId();
                _unitOfWork.Contacts.Update(contact);
            }
        }
    }

    private async Task AutoSyncContactLifecycleToCustomerAsync(Guid opportunityId)
    {
        var linkedContactIds = await _unitOfWork.OpportunityContacts.Query()
            .AsNoTracking()
            .Where(oc => oc.strOpportunityGUID == opportunityId)
            .Select(oc => oc.strContactGUID)
            .ToListAsync();

        if (linkedContactIds.Count == 0) return;

        var contacts = await _unitOfWork.Contacts.Query()
            .Where(c => linkedContactIds.Contains(c.strContactGUID))
            .ToListAsync();

        var allStages = ContactLifecycleStageConstants.AllStages;
        var customerIdx = Array.IndexOf(allStages, ContactLifecycleStageConstants.Customer);

        foreach (var contact in contacts)
        {
            var currentIdx = Array.IndexOf(allStages, contact.strLifecycleStage);
            if (customerIdx > currentIdx)
            {
                contact.strLifecycleStage = ContactLifecycleStageConstants.Customer;
                contact.dtUpdatedOn = DateTime.UtcNow;
                contact.strUpdatedByGUID = GetCurrentUserId();
                _unitOfWork.Contacts.Update(contact);
            }
        }
    }

    private static string MapProbabilityToLifecycleStage(int probability, bool isWonStage)
    {
        if (isWonStage) return ContactLifecycleStageConstants.Customer;
        return probability switch
        {
            <= 20 => ContactLifecycleStageConstants.Lead,
            <= 40 => ContactLifecycleStageConstants.MQL,
            <= 60 => ContactLifecycleStageConstants.SQL,
            <= 80 => ContactLifecycleStageConstants.Opportunity,
            _     => ContactLifecycleStageConstants.Customer,
        };
    }
}
