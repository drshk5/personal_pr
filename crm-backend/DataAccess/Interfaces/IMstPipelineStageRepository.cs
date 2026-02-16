using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstPipelineStageRepository : IRepository<MstPipelineStage>
{
    Task<MstPipelineStage?> GetFirstStageAsync(Guid pipelineGuid);
}
