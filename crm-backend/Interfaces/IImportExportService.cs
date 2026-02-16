using crm_backend.DTOs.CustomerData;

namespace crm_backend.Interfaces;

public interface IImportExportService
{
    Task<ImportJobListDto> StartImportAsync(Stream csvStream, string fileName, ImportStartDto settings, Guid tenantId, Guid userId);
    Task<ImportSuggestMappingResultDto> SuggestMappingAsync(Stream csvStream);
    Task<byte[]> ExportLeadsAsync(ExportRequestDto filter, Guid tenantId);
}
