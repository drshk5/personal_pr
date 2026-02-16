using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstActivityLinkRepository : IMstActivityLinkRepository
{
    private readonly CrmDbContext _context;

    public MstActivityLinkRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<MstActivityLink?> GetByIdAsync(Guid id) => await _context.MstActivityLinks.FindAsync(id);
    public async Task<IEnumerable<MstActivityLink>> GetAllAsync() => await _context.MstActivityLinks.ToListAsync();
    public IQueryable<MstActivityLink> Query() => _context.MstActivityLinks.AsQueryable();
    public async Task AddAsync(MstActivityLink entity) => await _context.MstActivityLinks.AddAsync(entity);
    public void Update(MstActivityLink entity) => _context.MstActivityLinks.Update(entity);
    public void Delete(MstActivityLink entity) => _context.MstActivityLinks.Remove(entity);

    public async Task<IEnumerable<MstActivityLink>> GetByEntityAsync(string entityType, Guid entityGuid)
    {
        return await _context.MstActivityLinks
            .Include(al => al.Activity)
            .Where(al => al.strEntityType == entityType && al.strEntityGUID == entityGuid)
            .OrderByDescending(al => al.Activity.dtCreatedOn)
            .ToListAsync();
    }
}
