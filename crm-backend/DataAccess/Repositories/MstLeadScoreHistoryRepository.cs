using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstLeadScoreHistoryRepository : IMstLeadScoreHistoryRepository
{
    private readonly CrmDbContext _context;

    public MstLeadScoreHistoryRepository(CrmDbContext context) => _context = context;

    public async Task<MstLeadScoreHistory?> GetByIdAsync(Guid id) => await _context.MstLeadScoreHistory.FindAsync(id);
    public async Task<IEnumerable<MstLeadScoreHistory>> GetAllAsync() => await _context.MstLeadScoreHistory.ToListAsync();
    public IQueryable<MstLeadScoreHistory> Query() => _context.MstLeadScoreHistory.AsQueryable();
    public async Task AddAsync(MstLeadScoreHistory entity) => await _context.MstLeadScoreHistory.AddAsync(entity);
    public void Update(MstLeadScoreHistory entity) => _context.MstLeadScoreHistory.Update(entity);
    public void Delete(MstLeadScoreHistory entity) => _context.MstLeadScoreHistory.Remove(entity);

    public async Task<IEnumerable<MstLeadScoreHistory>> GetByLeadIdAsync(Guid leadGuid)
        => await _context.MstLeadScoreHistory.Where(h => h.strLeadGUID == leadGuid).OrderByDescending(h => h.dtCreatedOn).ToListAsync();
}
