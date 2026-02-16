using crm_backend.DTOs.CustomerData;

namespace crm_backend.Interfaces;

public interface IImportExportService
{
    Task<ImportJobListDto> StartImportAsync(Stream csvStream, string fileName, ImportStartDto settings, Guid tenantId, Guid userId);
    Task<ImportSuggestMappingResultDto> SuggestMappingAsync(Stream csvStream);
    Task<byte[]> ExportLeadsAsync(ExportRequestDto filter, Guid tenantId);
    Task<ImportJobListDto> StartContactImportAsync(Stream csvStream, string fileName, ImportStartDto settings, Guid tenantId, Guid userId);
    Task<ImportSuggestMappingResultDto> SuggestContactMappingAsync(Stream csvStream);
    Task<byte[]> ExportContactsAsync(ContactFilterParams filter, Guid tenantId);
    Task<ImportJobListDto> StartAccountImportAsync(Stream csvStream, string fileName, ImportStartDto settings, Guid tenantId, Guid userId);
    Task<ImportSuggestMappingResultDto> SuggestAccountMappingAsync(Stream csvStream);
    Task<byte[]> ExportAccountsAsync(AccountFilterParams filter, Guid tenantId);
}
