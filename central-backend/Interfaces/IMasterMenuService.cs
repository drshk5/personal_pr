using AuditSoftware.DTOs.MasterMenu;
using AuditSoftware.DTOs.Common;
using System.Collections.Generic;
using System;

namespace AuditSoftware.Interfaces
{
    public interface IMasterMenuService
    {
        Task<MasterMenuResponseDto> CreateMasterMenuAsync(MasterMenuCreateDto masterMenuDto);
        Task<MasterMenuResponseDto> GetMasterMenuByIdAsync(Guid guid);
        Task<MasterMenuResponseDto> UpdateMasterMenuAsync(Guid guid, MasterMenuCreateDto masterMenuDto);
        Task<bool> DeleteMasterMenuAsync(Guid guid);
        Task<PagedResponse<MasterMenuResponseDto>> GetAllMasterMenusAsync(MasterMenuFilterDto filterDto);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportMasterMenusAsync(string format);
    }
}
