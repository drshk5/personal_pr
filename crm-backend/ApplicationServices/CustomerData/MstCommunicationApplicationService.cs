using Microsoft.EntityFrameworkCore;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.DTOs.Common;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.CustomerData;

public class MstCommunicationApplicationService : ApplicationServiceBase, IMstCommunicationApplicationService
{
    private readonly IAuditLogService _auditLogService;

    public MstCommunicationApplicationService(
        IUnitOfWork unitOfWork, ITenantContextProvider tenantContextProvider,
        IAuditLogService auditLogService, ILogger<MstCommunicationApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger) { _auditLogService = auditLogService; }

    public async Task<CommunicationDetailDto> LogEmailAsync(LogEmailDto dto)
    {
        var comm = new MstLeadCommunication
        {
            strCommunicationGUID = Guid.NewGuid(), strGroupGUID = GetTenantId(), strLeadGUID = dto.strLeadGUID,
            strChannelType = CommunicationChannelConstants.Email, strDirection = dto.strDirection,
            strSubject = dto.strSubject, strBody = dto.strBody, strFromAddress = dto.strFromAddress,
            strToAddress = dto.strToAddress, strTrackingPixelGUID = Guid.NewGuid(),
            strCreatedByGUID = GetCurrentUserId(), dtCreatedOn = DateTime.UtcNow
        };
        return await SaveCommunication(comm);
    }

    public async Task<CommunicationDetailDto> LogCallAsync(LogCallDto dto)
    {
        var comm = new MstLeadCommunication
        {
            strCommunicationGUID = Guid.NewGuid(), strGroupGUID = GetTenantId(), strLeadGUID = dto.strLeadGUID,
            strChannelType = CommunicationChannelConstants.Call, strDirection = dto.strDirection,
            strSubject = dto.strSubject, intDurationSeconds = dto.intDurationSeconds,
            strCallOutcome = dto.strCallOutcome, strRecordingUrl = dto.strRecordingUrl,
            strCreatedByGUID = GetCurrentUserId(), dtCreatedOn = DateTime.UtcNow
        };
        return await SaveCommunication(comm);
    }

    public async Task<CommunicationDetailDto> LogSmsAsync(LogSmsDto dto)
    {
        var comm = new MstLeadCommunication
        {
            strCommunicationGUID = Guid.NewGuid(), strGroupGUID = GetTenantId(), strLeadGUID = dto.strLeadGUID,
            strChannelType = CommunicationChannelConstants.SMS, strDirection = dto.strDirection,
            strBody = dto.strBody, strFromAddress = dto.strFromAddress, strToAddress = dto.strToAddress,
            strCreatedByGUID = GetCurrentUserId(), dtCreatedOn = DateTime.UtcNow
        };
        return await SaveCommunication(comm);
    }

    public async Task<CommunicationDetailDto> LogWhatsAppAsync(LogWhatsAppDto dto)
    {
        var comm = new MstLeadCommunication
        {
            strCommunicationGUID = Guid.NewGuid(), strGroupGUID = GetTenantId(), strLeadGUID = dto.strLeadGUID,
            strChannelType = CommunicationChannelConstants.WhatsApp, strDirection = dto.strDirection,
            strBody = dto.strBody, strFromAddress = dto.strFromAddress, strToAddress = dto.strToAddress,
            strExternalMessageId = dto.strExternalMessageId,
            strCreatedByGUID = GetCurrentUserId(), dtCreatedOn = DateTime.UtcNow
        };
        return await SaveCommunication(comm);
    }

    public async Task<PagedResponse<CommunicationListDto>> GetCommunicationsAsync(CommunicationFilterParams filter)
    {
        var query = _unitOfWork.LeadCommunications.Query();
        if (filter.strLeadGUID.HasValue) query = query.Where(c => c.strLeadGUID == filter.strLeadGUID.Value);
        if (!string.IsNullOrWhiteSpace(filter.strChannelType)) query = query.Where(c => c.strChannelType == filter.strChannelType);
        if (!string.IsNullOrWhiteSpace(filter.strDirection)) query = query.Where(c => c.strDirection == filter.strDirection);

        var totalCount = await query.CountAsync();
        var items = await query.OrderByDescending(c => c.dtCreatedOn)
            .Skip((filter.PageNumber - 1) * filter.PageSize).Take(filter.PageSize).ToListAsync();

        return new PagedResponse<CommunicationListDto>
        {
            Items = items.Select(MapToListDto).ToList(), TotalCount = totalCount,
            PageNumber = filter.PageNumber, PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<CommunicationDetailDto> GetByIdAsync(Guid id)
    {
        var comm = await _unitOfWork.LeadCommunications.GetByIdAsync(id);
        if (comm == null) throw new NotFoundException("Communication not found", "COMMUNICATION_NOT_FOUND");
        return MapToDetailDto(comm);
    }

    public async Task<PagedResponse<CommunicationListDto>> GetLeadTimelineAsync(Guid leadId, PagedRequestDto paging)
    {
        var query = _unitOfWork.LeadCommunications.Query().Where(c => c.strLeadGUID == leadId);
        var totalCount = await query.CountAsync();
        var items = await query.OrderByDescending(c => c.dtCreatedOn)
            .Skip((paging.PageNumber - 1) * paging.PageSize).Take(paging.PageSize).ToListAsync();

        return new PagedResponse<CommunicationListDto>
        {
            Items = items.Select(MapToListDto).ToList(), TotalCount = totalCount,
            PageNumber = paging.PageNumber, PageSize = paging.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)paging.PageSize)
        };
    }

    private async Task<CommunicationDetailDto> SaveCommunication(MstLeadCommunication comm)
    {
        await _unitOfWork.LeadCommunications.AddAsync(comm);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogService.LogAsync(EntityTypeConstants.Communication, comm.strCommunicationGUID, "Create", null, GetCurrentUserId());
        return MapToDetailDto(comm);
    }

    private static CommunicationListDto MapToListDto(MstLeadCommunication c) => new()
    {
        strCommunicationGUID = c.strCommunicationGUID, strLeadGUID = c.strLeadGUID,
        strChannelType = c.strChannelType, strDirection = c.strDirection, strSubject = c.strSubject,
        intDurationSeconds = c.intDurationSeconds, strCallOutcome = c.strCallOutcome,
        bolIsOpened = c.bolIsOpened, intClickCount = c.intClickCount, dtCreatedOn = c.dtCreatedOn
    };

    private static CommunicationDetailDto MapToDetailDto(MstLeadCommunication c) => new()
    {
        strCommunicationGUID = c.strCommunicationGUID, strLeadGUID = c.strLeadGUID,
        strChannelType = c.strChannelType, strDirection = c.strDirection, strSubject = c.strSubject,
        intDurationSeconds = c.intDurationSeconds, strCallOutcome = c.strCallOutcome,
        bolIsOpened = c.bolIsOpened, intClickCount = c.intClickCount, dtCreatedOn = c.dtCreatedOn,
        strBody = c.strBody, strFromAddress = c.strFromAddress, strToAddress = c.strToAddress,
        strRecordingUrl = c.strRecordingUrl, dtOpenedOn = c.dtOpenedOn,
        strExternalMessageId = c.strExternalMessageId, strCreatedByGUID = c.strCreatedByGUID
    };
}
