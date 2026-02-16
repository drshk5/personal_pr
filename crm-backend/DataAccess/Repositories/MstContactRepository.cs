using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstContactRepository : IMstContactRepository
{
    private readonly CrmDbContext _context;

    public MstContactRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<MstContact?> GetByIdAsync(Guid id) => await _context.MstContacts.FindAsync(id);
    public async Task<IEnumerable<MstContact>> GetAllAsync() => await _context.MstContacts.ToListAsync();
    public IQueryable<MstContact> Query() => _context.MstContacts.AsQueryable();
    public IQueryable<MstContact> QueryIncludingDeleted() => _context.MstContacts.IgnoreQueryFilters().AsQueryable();
    public async Task AddAsync(MstContact entity) => await _context.MstContacts.AddAsync(entity);
    public async Task AddRangeAsync(IEnumerable<MstContact> entities) => await _context.MstContacts.AddRangeAsync(entities);
    public void Update(MstContact entity) => _context.MstContacts.Update(entity);
    public void Delete(MstContact entity) => _context.MstContacts.Remove(entity);

    public async Task<MstContact?> GetByEmailAsync(string email, Guid groupGuid)
    {
        return await _context.MstContacts
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.strEmail == email);
    }
}
