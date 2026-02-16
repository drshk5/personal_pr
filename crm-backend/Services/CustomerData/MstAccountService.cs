using crm_backend.Data;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Services.CustomerData;

public class MstAccountService : ServiceBase, IAccountService
{
    public MstAccountService(ITenantContextProvider tenantContextProvider, ILogger<MstAccountService> logger)
        : base(tenantContextProvider, logger)
    {
    }

    public void ValidateAccountName(string accountName)
    {
        if (string.IsNullOrWhiteSpace(accountName))
        {
            throw new BusinessException("Account name is required", "ACCOUNT_NAME_REQUIRED");
        }

        if (accountName.Trim().Length > 200)
        {
            throw new BusinessException("Account name must not exceed 200 characters", "ACCOUNT_NAME_TOO_LONG");
        }
    }

    public void ValidateForDeletion(MstAccount account, int contactCount, int opportunityCount)
    {
        if (contactCount > 0)
        {
            throw new BusinessException(
                $"Cannot delete account with {contactCount} associated contact(s). Reassign or remove contacts first.",
                "ACCOUNT_HAS_CONTACTS");
        }

        if (opportunityCount > 0)
        {
            throw new BusinessException(
                $"Cannot delete account with {opportunityCount} open opportunity(ies). Close or reassign opportunities first.",
                "ACCOUNT_HAS_OPPORTUNITIES");
        }
    }
}
