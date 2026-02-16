using crm_backend.DTOs.CustomerData;
using crm_backend.DTOs.Common;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstCommunicationApplicationService : IApplicationService
{
    Task<CommunicationDetailDto> LogEmailAsync(LogEmailDto dto);
    Task<CommunicationDetailDto> LogCallAsync(LogCallDto dto);
    Task<CommunicationDetailDto> LogSmsAsync(LogSmsDto dto);
    Task<CommunicationDetailDto> LogWhatsAppAsync(LogWhatsAppDto dto);
    Task<PagedResponse<CommunicationListDto>> GetCommunicationsAsync(CommunicationFilterParams filter);
    Task<CommunicationDetailDto> GetByIdAsync(Guid id);
    Task<PagedResponse<CommunicationListDto>> GetLeadTimelineAsync(Guid leadId, PagedRequestDto paging);
}
