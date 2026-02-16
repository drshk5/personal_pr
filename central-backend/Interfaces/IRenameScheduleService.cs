using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.RenameSchedule;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AuditSoftware.Interfaces
{
    public interface IRenameScheduleService
    {
        Task<RenameScheduleResponseDto> CreateAsync(RenameScheduleCreateDto createDto, string createdByGUID, string groupGUID);
        Task<PagedResponse<RenameScheduleResponseDto>> GetAllAsync(RenameScheduleFilterDto filterDto, string groupGUID);
        Task<RenameScheduleResponseDto> GetByIdAsync(string guid);
        Task<RenameScheduleResponseDto> UpdateAsync(string guid, RenameScheduleUpdateDto updateDto, string updatedByGUID, string groupGUID);
        Task<bool> DeleteAsync(string guid, string userGUID);
        Task<RenameScheduleResponseDto> UpsertAsync(RenameScheduleUpsertDto upsertDto, string userGUID, string groupGUID);
    }
}