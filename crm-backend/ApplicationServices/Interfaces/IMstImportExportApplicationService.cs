using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstImportExportApplicationService : IApplicationService
{
    Task<ImportJobListDto> StartImportAsync(Stream csvStream, string fileName, ImportStartDto settings);
    Task<ImportSuggestMappingResultDto> SuggestMappingAsync(Stream csvStream);
    Task<PagedResponse<ImportJobListDto>> GetImportJobsAsync(ImportJobFilterParams filter);
    Task<ImportJobDetailDto> GetImportJobByIdAsync(Guid id);
    Task<byte[]> ExportLeadsAsync(ExportRequestDto filter);
    Task<ImportJobListDto> StartContactImportAsync(Stream csvStream, string fileName, ImportStartDto settings);
    Task<ImportSuggestMappingResultDto> SuggestContactMappingAsync(Stream csvStream);
    Task<byte[]> ExportContactsAsync(ContactFilterParams filter);
    Task<ImportJobListDto> StartAccountImportAsync(Stream csvStream, string fileName, ImportStartDto settings);
    Task<ImportSuggestMappingResultDto> SuggestAccountMappingAsync(Stream csvStream);
    Task<byte[]> ExportAccountsAsync(AccountFilterParams filter);
}
