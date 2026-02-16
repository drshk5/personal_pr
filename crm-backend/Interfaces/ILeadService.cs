using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Interfaces;

public interface ILeadService
{
    int CalculateScore(MstLead lead);
    void ValidateStatusTransition(string currentStatus, string newStatus);
    void ValidateForConversion(MstLead lead);
}
