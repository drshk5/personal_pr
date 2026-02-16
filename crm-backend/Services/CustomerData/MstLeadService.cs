using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.Exceptions;
using crm_backend.Helpers;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Services.CustomerData;

public class MstLeadService : ServiceBase, ILeadService
{
    public MstLeadService(ITenantContextProvider tenantContextProvider, ILogger<MstLeadService> logger)
        : base(tenantContextProvider, logger)
    {
    }

    public int CalculateScore(MstLead lead)
    {
        return LeadScoringHelper.CalculateScore(lead);
    }

    public void ValidateStatusTransition(string currentStatus, string newStatus)
    {
        if (!LeadStatusConstants.AllStatuses.Contains(newStatus))
        {
            throw new BusinessException(
                $"Invalid status '{newStatus}'. Must be one of: {string.Join(", ", LeadStatusConstants.AllStatuses)}",
                LeadErrorCodes.InvalidStatusTransition);
        }

        // Cannot change status of converted lead
        if (currentStatus == LeadStatusConstants.Converted)
        {
            throw new BusinessException(
                "Cannot change status of a converted lead",
                LeadErrorCodes.LeadAlreadyConverted);
        }

        // Cannot directly set to Converted (must go through conversion flow)
        if (newStatus == LeadStatusConstants.Converted)
        {
            throw new BusinessException(
                "Cannot directly set status to Converted. Use the conversion API",
                LeadErrorCodes.InvalidStatusTransition);
        }
    }

    public void ValidateForConversion(MstLead lead)
    {
        if (lead.strStatus == LeadStatusConstants.Converted)
        {
            throw new BusinessException(
                "Lead has already been converted",
                LeadErrorCodes.LeadAlreadyConverted);
        }

        if (!LeadStatusConstants.ConvertibleStatuses.Contains(lead.strStatus))
        {
            throw new BusinessException(
                $"Lead must be in '{string.Join("' or '", LeadStatusConstants.ConvertibleStatuses)}' status to be converted. Current status: '{lead.strStatus}'",
                LeadErrorCodes.LeadNotQualified);
        }
    }
}
