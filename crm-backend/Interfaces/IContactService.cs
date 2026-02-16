using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Interfaces;

public interface IContactService
{
    void ValidateLifecycleStageTransition(string currentStage, string newStage);
}
