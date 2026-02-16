using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstAccountApplicationService : IApplicationService
{
    Task<PagedResponse<AccountListDto>> GetAccountsAsync(AccountFilterParams filter);
    Task<AccountDetailDto> GetAccountByIdAsync(Guid id);
    Task<AccountDetailDto> CreateAccountAsync(CreateAccountDto dto);
    Task<AccountDetailDto> UpdateAccountAsync(Guid id, UpdateAccountDto dto);
    Task<bool> DeleteAccountAsync(Guid id);
    Task<bool> BulkArchiveAsync(AccountBulkArchiveDto dto);
    Task<bool> BulkRestoreAsync(AccountBulkArchiveDto dto);
}
