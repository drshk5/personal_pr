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
    {
        // intSortOrder is unmapped (legacy DB doesn't have this column), so we load then sort client-side
        var rules = await _context.MstLeadScoringRules
            .Where(r => r.bolIsActive && r.strRuleCategory == category)
            .ToListAsync();
        return rules.OrderBy(r => r.intSortOrder);
    }

    public async Task<IEnumerable<MstLeadScoringRule>> GetAllActiveRulesAsync()
    {
        // intSortOrder is unmapped (legacy DB doesn't have this column), so we load then sort client-side
        var rules = await _context.MstLeadScoringRules
            .Where(r => r.bolIsActive)
            .ToListAsync();
        return rules.OrderBy(r => r.intSortOrder);
    }
}
