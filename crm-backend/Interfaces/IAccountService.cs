using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Interfaces;

public interface IAccountService
{
    void ValidateAccountName(string accountName);
    void ValidateForDeletion(MstAccount account, int contactCount, int opportunityCount);
}
