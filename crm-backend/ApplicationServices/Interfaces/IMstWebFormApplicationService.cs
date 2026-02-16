using crm_backend.DTOs.Common;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstWebFormApplicationService : IApplicationService
{
    Task<PagedResponse<WebFormListDto>> GetFormsAsync(WebFormFilterParams filter);
    Task<WebFormDetailDto> GetFormByIdAsync(Guid id);
    Task<WebFormDetailDto> CreateFormAsync(CreateWebFormDto dto);
    Task<WebFormDetailDto> UpdateFormAsync(Guid id, UpdateWebFormDto dto);
    Task<bool> DeleteFormAsync(Guid id);
    Task<WebFormEmbedCodeDto> GetEmbedCodeAsync(Guid id);
    Task<WebFormSubmissionListDto> SubmitFormAsync(Guid formId, WebFormSubmitDto dto, string? ipAddress, string? userAgent);
    Task<PagedResponse<WebFormSubmissionListDto>> GetSubmissionsAsync(Guid formId, PagedRequestDto paging);
}
