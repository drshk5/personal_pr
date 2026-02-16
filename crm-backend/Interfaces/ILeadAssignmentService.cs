using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Interfaces;

public interface ILeadAssignmentService
{
    Task<LeadAssignmentResultDto?> AssignLeadAsync(MstLead lead);
}
