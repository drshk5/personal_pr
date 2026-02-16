using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.AccountType;

namespace AuditSoftware.Interfaces
{
    public interface IAccountTypeService
    {
        Task<AccountTypeResponseDto> CreateAsync(AccountTypeCreateDto createDto, string createdByGUID);
        Task<AccountTypeResponseDto> UpdateAsync(string guid, AccountTypeUpdateDto updateDto, string updatedByGUID);
        Task<AccountTypeResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<AccountTypeResponseDto>> GetAllAsync(AccountTypeFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<AccountTypeSimpleDto>> GetActiveAccountTypesAsync(string? searchTerm = null);
        Task<List<AccountTypeSimpleDto>> GetOnlyBankAccountTypesAsync(string? searchTerm = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportAccountTypesAsync(string format);
    }
}
