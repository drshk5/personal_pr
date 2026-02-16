using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstLeadDuplicateRepository : IMstLeadDuplicateRepository
{
    private readonly CrmDbContext _context;

    public MstLeadDuplicateRepository(CrmDbContext context) => _context = context;

    public async Task<MstLeadDuplicate?> GetByIdAsync(Guid id) => await _context.MstLeadDuplicates.FindAsync(id);
    public async Task<IEnumerable<MstLeadDuplicate>> GetAllAsync() => await _context.MstLeadDuplicates.ToListAsync();
    public IQueryable<MstLeadDuplicate> Query() => _context.MstLeadDuplicates.AsQueryable();
    public async Task AddAsync(MstLeadDuplicate entity) => await _context.MstLeadDuplicates.AddAsync(entity);
    public void Update(MstLeadDuplicate entity) => _context.MstLeadDuplicates.Update(entity);
    public void Delete(MstLeadDuplicate entity) => _context.MstLeadDuplicates.Remove(entity);

    public async Task<IEnumerable<MstLeadDuplicate>> GetPendingSuggestionsAsync()
        => await _context.MstLeadDuplicates.Where(d => d.strStatus == "Pending").OrderByDescending(d => d.dblConfidenceScore).ToListAsync();

    public async Task<IEnumerable<MstLeadDuplicate>> GetByLeadIdAsync(Guid leadGuid)
        => await _context.MstLeadDuplicates.Where(d => d.strLeadGUID1 == leadGuid || d.strLeadGUID2 == leadGuid).ToListAsync();
}
