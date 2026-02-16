using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstImportJobRepository : IMstImportJobRepository
{
    private readonly CrmDbContext _context;

    public MstImportJobRepository(CrmDbContext context) => _context = context;

    public async Task<MstImportJob?> GetByIdAsync(Guid id) => await _context.MstImportJobs.FindAsync(id);
    public async Task<IEnumerable<MstImportJob>> GetAllAsync() => await _context.MstImportJobs.ToListAsync();
    public IQueryable<MstImportJob> Query() => _context.MstImportJobs.AsQueryable();
    public async Task AddAsync(MstImportJob entity) => await _context.MstImportJobs.AddAsync(entity);
    public void Update(MstImportJob entity) => _context.MstImportJobs.Update(entity);
    public void Delete(MstImportJob entity) => _context.MstImportJobs.Remove(entity);

    public async Task<IEnumerable<MstImportJob>> GetPendingJobsAsync()
        => await _context.MstImportJobs.Where(j => j.strStatus == "Pending").OrderBy(j => j.dtCreatedOn).ToListAsync();
}
