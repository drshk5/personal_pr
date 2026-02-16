using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstLeadScoringRuleRepository : IMstLeadScoringRuleRepository
{
    private readonly CrmDbContext _context;

    public MstLeadScoringRuleRepository(CrmDbContext context) => _context = context;

    public async Task<MstLeadScoringRule?> GetByIdAsync(Guid id) => await _context.MstLeadScoringRules.FindAsync(id);
    public async Task<IEnumerable<MstLeadScoringRule>> GetAllAsync() => await _context.MstLeadScoringRules.ToListAsync();
    public IQueryable<MstLeadScoringRule> Query() => _context.MstLeadScoringRules.AsQueryable();
    public async Task AddAsync(MstLeadScoringRule entity) => await _context.MstLeadScoringRules.AddAsync(entity);
    public void Update(MstLeadScoringRule entity) => _context.MstLeadScoringRules.Update(entity);
    public void Delete(MstLeadScoringRule entity) => _context.MstLeadScoringRules.Remove(entity);

    public async Task<IEnumerable<MstLeadScoringRule>> GetActiveRulesByCategoryAsync(string category)
        => await _context.MstLeadScoringRules.Where(r => r.bolIsActive && r.strRuleCategory == category).OrderBy(r => r.intSortOrder).ToListAsync();

    public async Task<IEnumerable<MstLeadScoringRule>> GetAllActiveRulesAsync()
        => await _context.MstLeadScoringRules.Where(r => r.bolIsActive).OrderBy(r => r.intSortOrder).ToListAsync();
}
