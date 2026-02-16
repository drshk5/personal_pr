using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstWebFormRepository : IMstWebFormRepository
{
    private readonly CrmDbContext _context;

    public MstWebFormRepository(CrmDbContext context) => _context = context;

    public async Task<MstWebForm?> GetByIdAsync(Guid id) => await _context.MstWebForms.FindAsync(id);
    public async Task<IEnumerable<MstWebForm>> GetAllAsync() => await _context.MstWebForms.ToListAsync();
    public IQueryable<MstWebForm> Query() => _context.MstWebForms.AsQueryable();
    public async Task AddAsync(MstWebForm entity) => await _context.MstWebForms.AddAsync(entity);
    public void Update(MstWebForm entity) => _context.MstWebForms.Update(entity);
    public void Delete(MstWebForm entity) => _context.MstWebForms.Remove(entity);

    public async Task<MstWebForm?> GetByIdWithFieldsAsync(Guid formGuid)
        => await _context.MstWebForms.Include(f => f.Fields.OrderBy(ff => ff.intSortOrder)).FirstOrDefaultAsync(f => f.strWebFormGUID == formGuid);
}
