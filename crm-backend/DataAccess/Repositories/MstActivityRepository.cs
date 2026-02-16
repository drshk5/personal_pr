using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstActivityRepository : IMstActivityRepository
{
    private readonly CrmDbContext _context;

    public MstActivityRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<MstActivity?> GetByIdAsync(Guid id) => await _context.MstActivities.FindAsync(id);
    public async Task<IEnumerable<MstActivity>> GetAllAsync() => await _context.MstActivities.ToListAsync();
    public IQueryable<MstActivity> Query() => _context.MstActivities.AsQueryable();
    public async Task AddAsync(MstActivity entity) => await _context.MstActivities.AddAsync(entity);
    public void Update(MstActivity entity) => _context.MstActivities.Update(entity);
    public void Delete(MstActivity entity) => _context.MstActivities.Remove(entity);
}
