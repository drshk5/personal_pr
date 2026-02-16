using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstOpportunityRepository : IMstOpportunityRepository
{
    private readonly CrmDbContext _context;

    public MstOpportunityRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<MstOpportunity?> GetByIdAsync(Guid id) => await _context.MstOpportunities.FindAsync(id);
    public async Task<IEnumerable<MstOpportunity>> GetAllAsync() => await _context.MstOpportunities.ToListAsync();
    public IQueryable<MstOpportunity> Query() => _context.MstOpportunities.AsQueryable();
    public IQueryable<MstOpportunity> QueryIncludingDeleted() => _context.MstOpportunities.IgnoreQueryFilters().AsQueryable();
    public async Task AddAsync(MstOpportunity entity) => await _context.MstOpportunities.AddAsync(entity);
    public void Update(MstOpportunity entity) => _context.MstOpportunities.Update(entity);
    public void Delete(MstOpportunity entity) => _context.MstOpportunities.Remove(entity);
}
