using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstImportJobErrorRepository : IMstImportJobErrorRepository
{
    private readonly CrmDbContext _context;

    public MstImportJobErrorRepository(CrmDbContext context) => _context = context;

    public async Task<MstImportJobError?> GetByIdAsync(Guid id) => await _context.MstImportJobErrors.FindAsync(id);
    public async Task<IEnumerable<MstImportJobError>> GetAllAsync() => await _context.MstImportJobErrors.ToListAsync();
    public IQueryable<MstImportJobError> Query() => _context.MstImportJobErrors.AsQueryable();
    public async Task AddAsync(MstImportJobError entity) => await _context.MstImportJobErrors.AddAsync(entity);
    public void Update(MstImportJobError entity) => _context.MstImportJobErrors.Update(entity);
    public void Delete(MstImportJobError entity) => _context.MstImportJobErrors.Remove(entity);

    public async Task<IEnumerable<MstImportJobError>> GetByJobIdAsync(Guid jobGuid)
        => await _context.MstImportJobErrors.Where(e => e.strImportJobGUID == jobGuid).OrderBy(e => e.intRowNumber).ToListAsync();
}
