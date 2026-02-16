using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Services.CustomerData;

public class MstContactService : ServiceBase, IContactService
{
    public MstContactService(ITenantContextProvider tenantContextProvider, ILogger<MstContactService> logger)
        : base(tenantContextProvider, logger)
    {
    }

    public void ValidateLifecycleStageTransition(string currentStage, string newStage)
    {
        if (!ContactLifecycleStageConstants.AllStages.Contains(newStage))
        {
            throw new BusinessException(
                $"Invalid lifecycle stage '{newStage}'. Must be one of: {string.Join(", ", ContactLifecycleStageConstants.AllStages)}",
                ContactErrorCodes.InvalidLifecycleStage);
        }
    }
}
