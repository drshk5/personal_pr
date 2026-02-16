using AuditSoftware.DTOs.Menu;
using AuditSoftware.DTOs.Common;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace AuditSoftware.Interfaces
{
    public interface IMenuService
    {
        Task<MenuResponseDto> CreateMenuAsync(MenuCreateDto menuDto);
        Task<MenuResponseDto> GetMenuByIdAsync(Guid guid);
        Task<MenuResponseDto> UpdateMenuAsync(Guid guid, MenuCreateDto menuDto);
        Task<bool> DeleteMenuAsync(Guid guid);
        Task<PagedResponse<MenuResponseDto>> GetAllMenusAsync(MenuFilterDto filterDto);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportMenusAsync(string format);

    }
} 