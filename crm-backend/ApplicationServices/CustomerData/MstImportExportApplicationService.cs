using Microsoft.EntityFrameworkCore;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Wrappers;
using System.Linq.Dynamic.Core;

namespace crm_backend.ApplicationServices.CustomerData;

public class MstImportExportApplicationService : ApplicationServiceBase, IMstImportExportApplicationService
{
    private readonly IImportExportService _importExportService;
    private readonly IAuditLogService _auditLogService;

    public MstImportExportApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        IImportExportService importExportService,
        IAuditLogService auditLogService,
        ILogger<MstImportExportApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _importExportService = importExportService;
        _auditLogService = auditLogService;
    }

    public async Task<ImportJobListDto> StartImportAsync(Stream csvStream, string fileName, ImportStartDto settings)
    {
        var tenantId = GetTenantId();
        var userId = GetCurrentUserId();

        var result = await _importExportService.StartImportAsync(csvStream, fileName, settings, tenantId, userId);

        await _auditLogService.LogAsync(
            Constants.EntityTypeConstants.ImportJob,
            result.strImportJobGUID,
            "Create",
            $"Import started: {fileName} ({result.intTotalRows} rows, {result.intSuccessRows} success, {result.intErrorRows} errors)",
            userId);

        _logger.LogInformation(
            "Import job {JobId} started by user {UserId} for tenant {TenantId}",
            result.strImportJobGUID, userId, tenantId);

        return result;
    }

    public async Task<ImportSuggestMappingResultDto> SuggestMappingAsync(Stream csvStream)
    {
        return await _importExportService.SuggestMappingAsync(csvStream);
    }

    public async Task<PagedResponse<ImportJobListDto>> GetImportJobsAsync(ImportJobFilterParams filter)
    {
        var query = _unitOfWork.ImportJobs.Query();

        // Apply status filter
        if (!string.IsNullOrWhiteSpace(filter.strStatus))
            query = query.Where(j => j.strStatus == filter.strStatus);

        // Apply search (by filename)
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.ToLower().Trim();
            query = query.Where(j => j.strFileName.ToLower().Contains(searchTerm));
        }

        // Get total count
        var totalCount = await query.CountAsync();

        // Apply sorting — use allowlist to prevent crashes on invalid sort fields
        if (!string.IsNullOrWhiteSpace(filter.SortBy))
        {
            var sortKey = filter.SortBy.Trim().ToLowerInvariant();
            query = sortKey switch
            {
                "strfilename" => filter.Ascending ? query.OrderBy(j => j.strFileName) : query.OrderByDescending(j => j.strFileName),
                "strstatus" => filter.Ascending ? query.OrderBy(j => j.strStatus) : query.OrderByDescending(j => j.strStatus),
                "inttotalrows" => filter.Ascending ? query.OrderBy(j => j.intTotalRows) : query.OrderByDescending(j => j.intTotalRows),
                "dtcreatedon" => filter.Ascending ? query.OrderBy(j => j.dtCreatedOn) : query.OrderByDescending(j => j.dtCreatedOn),
                "dtcompletedon" => filter.Ascending ? query.OrderBy(j => j.dtCompletedOn) : query.OrderByDescending(j => j.dtCompletedOn),
                _ => query.OrderByDescending(j => j.dtCreatedOn)
            };
        }
        else
        {
            query = query.OrderByDescending(j => j.dtCreatedOn);
        }

        // Apply pagination
        var items = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var dtos = items.Select(j => new ImportJobListDto
        {
            strImportJobGUID = j.strImportJobGUID,
            strFileName = j.strFileName,
            strStatus = j.strStatus,
            intTotalRows = j.intTotalRows,
            intProcessedRows = j.intProcessedRows,
            intSuccessRows = j.intSuccessRows,
            intErrorRows = j.intErrorRows,
            intDuplicateRows = j.intDuplicateRows,
            strDuplicateHandling = j.strDuplicateHandling,
            dtCreatedOn = j.dtCreatedOn,
            dtCompletedOn = j.dtCompletedOn
        }).ToList();

        return new PagedResponse<ImportJobListDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<ImportJobDetailDto> GetImportJobByIdAsync(Guid id)
    {
        var job = await _unitOfWork.ImportJobs.Query()
            .Include(j => j.Errors)
            .FirstOrDefaultAsync(j => j.strImportJobGUID == id);

        if (job == null)
            throw new NotFoundException("Import job not found");

        return new ImportJobDetailDto
        {
            strImportJobGUID = job.strImportJobGUID,
            strFileName = job.strFileName,
            strStatus = job.strStatus,
            intTotalRows = job.intTotalRows,
            intProcessedRows = job.intProcessedRows,
            intSuccessRows = job.intSuccessRows,
            intErrorRows = job.intErrorRows,
            intDuplicateRows = job.intDuplicateRows,
            strDuplicateHandling = job.strDuplicateHandling,
            dtCreatedOn = job.dtCreatedOn,
            dtCompletedOn = job.dtCompletedOn,
            strColumnMappingJson = job.strColumnMappingJson,
            Errors = job.Errors.OrderBy(e => e.intRowNumber).Select(e => new ImportJobErrorDto
            {
                strImportJobErrorGUID = e.strImportJobErrorGUID,
                intRowNumber = e.intRowNumber,
                strRawData = e.strRawDataJson,
                strErrorMessage = e.strErrorMessage,
                strErrorType = e.strErrorType
            }).ToList()
        };
    }

    public async Task<byte[]> ExportLeadsAsync(ExportRequestDto filter)
    {
        var tenantId = GetTenantId();

        var bytes = await _importExportService.ExportLeadsAsync(filter, tenantId);

        _logger.LogInformation(
            "Lead export completed by user {UserId} for tenant {TenantId}",
            GetCurrentUserId(), tenantId);

        return bytes;
    }

    public async Task<ImportJobListDto> StartContactImportAsync(Stream csvStream, string fileName, ImportStartDto settings)
    {
        var tenantId = GetTenantId();
        var userId = GetCurrentUserId();

        var result = await _importExportService.StartContactImportAsync(csvStream, fileName, settings, tenantId, userId);

        await _auditLogService.LogAsync(
            Constants.EntityTypeConstants.ImportJob,
            result.strImportJobGUID,
            "Create",
            $"Contact import started: {fileName} ({result.intTotalRows} rows, {result.intSuccessRows} success, {result.intErrorRows} errors)",
            userId);

        return result;
    }

    public async Task<ImportSuggestMappingResultDto> SuggestContactMappingAsync(Stream csvStream)
    {
        return await _importExportService.SuggestContactMappingAsync(csvStream);
    }

    public async Task<byte[]> ExportContactsAsync(ContactFilterParams filter)
    {
        var tenantId = GetTenantId();
        return await _importExportService.ExportContactsAsync(filter, tenantId);
    }

    public async Task<ImportJobListDto> StartAccountImportAsync(Stream csvStream, string fileName, ImportStartDto settings)
    {
        var tenantId = GetTenantId();
        var userId = GetCurrentUserId();

        var result = await _importExportService.StartAccountImportAsync(csvStream, fileName, settings, tenantId, userId);

        await _auditLogService.LogAsync(
            Constants.EntityTypeConstants.ImportJob,
            result.strImportJobGUID,
            "Create",
            $"Account import started: {fileName} ({result.intTotalRows} rows, {result.intSuccessRows} success, {result.intErrorRows} errors)",
            userId);

        return result;
    }

    public async Task<ImportSuggestMappingResultDto> SuggestAccountMappingAsync(Stream csvStream)
    {
        return await _importExportService.SuggestAccountMappingAsync(csvStream);
    }

    public async Task<byte[]> ExportAccountsAsync(AccountFilterParams filter)
    {
        var tenantId = GetTenantId();
        return await _importExportService.ExportAccountsAsync(filter, tenantId);
    }
}
