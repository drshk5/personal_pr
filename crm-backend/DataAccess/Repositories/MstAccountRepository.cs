using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstAccountRepository : IMstAccountRepository
{
    private readonly CrmDbContext _context;

    public MstAccountRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<MstAccount?> GetByIdAsync(Guid id) => await _context.MstAccounts.FindAsync(id);
    public async Task<IEnumerable<MstAccount>> GetAllAsync() => await _context.MstAccounts.ToListAsync();
    public IQueryable<MstAccount> Query() => _context.MstAccounts.AsQueryable();
    public IQueryable<MstAccount> QueryIncludingDeleted() => _context.MstAccounts.IgnoreQueryFilters().AsQueryable();
    public async Task AddAsync(MstAccount entity) => await _context.MstAccounts.AddAsync(entity);
    public async Task AddRangeAsync(IEnumerable<MstAccount> entities) => await _context.MstAccounts.AddRangeAsync(entities);
    public void Update(MstAccount entity) => _context.MstAccounts.Update(entity);
    public void Delete(MstAccount entity) => _context.MstAccounts.Remove(entity);
}
