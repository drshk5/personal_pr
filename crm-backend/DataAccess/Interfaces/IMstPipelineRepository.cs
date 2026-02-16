using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstPipelineRepository : IRepository<MstPipeline>
{
    Task<MstPipeline?> GetDefaultPipelineAsync();
    IQueryable<MstPipeline> QueryIncludingDeleted();
}
