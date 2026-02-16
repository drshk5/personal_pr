using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AuditSoftware.DTOs.Folder;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.Interfaces
{
    public interface IFolderService
    {
        Task<FolderResponseDto> CreateFolderInHierarchyAsync(FolderCreateDto createDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid, Guid yearGuid, Guid moduleGuid);
        Task<FolderResponseDto> UpdateFolderInHierarchyAsync(Guid folderGuid, SimpleFolderUpdateDto updateDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid, Guid yearGuid);
        // Removed SimplifiedAsync method as we're consolidating DTOs
        Task<FolderResponseDto> CreateAsync(FolderCreateDto createDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid, Guid yearGuid);
        Task<FolderResponseDto> GetByIdAsync(Guid folderGuid);
        Task<PagedResponse<FolderResponseDto>> GetAllAsync(BaseFilterDto filterDto);
        Task<PagedResponse<FolderResponseDto>> GetAllAsync(BaseFilterDto filterDto, Guid organizationGuid, Guid? moduleGuid = null);
        Task<PagedResponse<FolderResponseDto>> GetAllAsync(FolderFilterDto filterDto, Guid organizationGuid);
        Task<PagedResponse<FolderResponseDto>> GetFoldersByOrganizationAsync(Guid organizationGuid, BaseFilterDto filterDto, Guid? moduleGuid = null);
        Task<List<FolderSimpleResponseDto>> GetSimpleFoldersByOrganizationAsync(Guid organizationGuid);
        Task<List<FolderSimpleResponseDto>> GetSimpleFoldersByYearAsync(Guid yearGuid);
        Task<FolderResponseDto> UpdateAsync(Guid folderGuid, FolderUpdateDto updateDto, Guid currentUserGuid);
        Task<bool> DeleteAsync(Guid folderGuid);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportFoldersAsync(string format, Guid groupGuid, Guid organizationGuid);
    }
}