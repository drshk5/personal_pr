using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstLeadMergeHistoryRepository : IMstLeadMergeHistoryRepository
{
    private readonly CrmDbContext _context;

    public MstLeadMergeHistoryRepository(CrmDbContext context) => _context = context;

    public async Task<MstLeadMergeHistory?> GetByIdAsync(Guid id) => await _context.MstLeadMergeHistory.FindAsync(id);
    public async Task<IEnumerable<MstLeadMergeHistory>> GetAllAsync() => await _context.MstLeadMergeHistory.ToListAsync();
    public IQueryable<MstLeadMergeHistory> Query() => _context.MstLeadMergeHistory.AsQueryable();
    public async Task AddAsync(MstLeadMergeHistory entity) => await _context.MstLeadMergeHistory.AddAsync(entity);
    public void Update(MstLeadMergeHistory entity) => _context.MstLeadMergeHistory.Update(entity);
    public void Delete(MstLeadMergeHistory entity) => _context.MstLeadMergeHistory.Remove(entity);
}
