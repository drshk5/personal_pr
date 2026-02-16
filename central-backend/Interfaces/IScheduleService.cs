using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Schedule;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AuditSoftware.Interfaces
{
    public interface IScheduleService
    {
        Task<ScheduleResponseDto> CreateAsync(ScheduleCreateDto createDto, string createdByGUID, string groupGUID);
        Task<PagedResponse<ScheduleResponseDto>> GetAllAsync(ScheduleFilterDto filterDto, string groupGUID);
        Task<ScheduleResponseDto> GetByIdAsync(string guid);
        Task<ScheduleResponseDto> UpdateAsync(string guid, ScheduleUpdateDto updateDto, string updatedByGUID, string groupGUID);
        Task<bool> DeleteAsync(string guid);
        Task<List<ScheduleSimpleDto>> GetActiveSchedulesAsync(string? search, string groupGUID);
        Task<(byte[] fileContents, string contentType, string fileName)> ExportSchedulesAsync(string format, string groupGUID);
        Task<ImportScheduleResultDto> ImportSchedulesAsync(IFormFile file, string userGuid, string groupGUID);
        Task<List<ScheduleTreeDto>> GetActiveScheduleTreeAsync(string groupGUID);
        Task<(byte[] fileContents, string contentType, string fileName)> ExportActiveScheduleTreeToPdfAsync(string groupGUID);
        Task<(byte[] fileContents, string contentType, string fileName)> ExportActiveScheduleTreeToExcelAsync(string groupGUID);
    }
}
