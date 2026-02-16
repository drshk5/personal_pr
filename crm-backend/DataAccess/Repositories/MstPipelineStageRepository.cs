using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstPipelineStageRepository : IMstPipelineStageRepository
{
    private readonly CrmDbContext _context;

    public MstPipelineStageRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<MstPipelineStage?> GetByIdAsync(Guid id) => await _context.MstPipelineStages.FindAsync(id);
    public async Task<IEnumerable<MstPipelineStage>> GetAllAsync() => await _context.MstPipelineStages.ToListAsync();
    public IQueryable<MstPipelineStage> Query() => _context.MstPipelineStages.AsQueryable();
    public async Task AddAsync(MstPipelineStage entity) => await _context.MstPipelineStages.AddAsync(entity);
    public void Update(MstPipelineStage entity) => _context.MstPipelineStages.Update(entity);
    public void Delete(MstPipelineStage entity) => _context.MstPipelineStages.Remove(entity);

    public async Task<MstPipelineStage?> GetFirstStageAsync(Guid pipelineGuid)
    {
        return await _context.MstPipelineStages
            .Where(s => s.strPipelineGUID == pipelineGuid && s.bolIsActive)
            .OrderBy(s => s.intDisplayOrder)
            .FirstOrDefaultAsync();
    }
}
