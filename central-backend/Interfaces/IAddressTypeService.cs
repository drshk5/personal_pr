using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.AddressType;

namespace AuditSoftware.Interfaces
{
    public interface IAddressTypeService
    {
        Task<AddressTypeResponseDto> CreateAsync(AddressTypeCreateDto createDto, string createdByGUID);
        Task<AddressTypeResponseDto> UpdateAsync(string guid, AddressTypeUpdateDto updateDto, string updatedByGUID);
        Task<AddressTypeResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<AddressTypeResponseDto>> GetAllAsync(AddressTypeFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<AddressTypeSimpleDto>> GetActiveAddressTypesAsync(string searchTerm = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportAddressTypesAsync(string format);
    }
}
