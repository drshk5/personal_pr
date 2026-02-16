using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Interfaces;

public interface IWebFormService
{
    Task<Guid?> ProcessSubmissionAsync(MstWebForm form, WebFormSubmitDto submission, string? ipAddress, string? userAgent);
}
