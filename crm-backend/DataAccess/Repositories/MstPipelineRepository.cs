using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstPipelineRepository : IMstPipelineRepository
{
    private readonly CrmDbContext _context;

    public MstPipelineRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<MstPipeline?> GetByIdAsync(Guid id) => await _context.MstPipelines.FindAsync(id);
    public async Task<IEnumerable<MstPipeline>> GetAllAsync() => await _context.MstPipelines.ToListAsync();
    public IQueryable<MstPipeline> Query() => _context.MstPipelines.AsQueryable();
    public IQueryable<MstPipeline> QueryIncludingDeleted() => _context.MstPipelines.IgnoreQueryFilters().AsQueryable();
    public async Task AddAsync(MstPipeline entity) => await _context.MstPipelines.AddAsync(entity);
    public void Update(MstPipeline entity) => _context.MstPipelines.Update(entity);
    public void Delete(MstPipeline entity) => _context.MstPipelines.Remove(entity);

    public async Task<MstPipeline?> GetDefaultPipelineAsync()
    {
        return await _context.MstPipelines
            .Include(p => p.Stages.Where(s => s.bolIsActive).OrderBy(s => s.intDisplayOrder))
            .FirstOrDefaultAsync(p => p.bolIsDefault && p.bolIsActive);
    }
}
