using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstContactApplicationService : IApplicationService
{
    Task<PagedResponse<ContactListDto>> GetContactsAsync(ContactFilterParams filter);
    Task<ContactDetailDto> GetContactByIdAsync(Guid id);
    Task<ContactDetailDto> CreateContactAsync(CreateContactDto dto);
    Task<ContactDetailDto> UpdateContactAsync(Guid id, UpdateContactDto dto);
    Task<bool> DeleteContactAsync(Guid id);
    Task<bool> BulkArchiveAsync(ContactBulkArchiveDto dto);
    Task<bool> BulkRestoreAsync(ContactBulkArchiveDto dto);
}
