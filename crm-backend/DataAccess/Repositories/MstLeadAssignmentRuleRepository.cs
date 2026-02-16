using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstLeadAssignmentRuleRepository : IMstLeadAssignmentRuleRepository
{
    private readonly CrmDbContext _context;

    public MstLeadAssignmentRuleRepository(CrmDbContext context) => _context = context;

    public async Task<MstLeadAssignmentRule?> GetByIdAsync(Guid id) => await _context.MstLeadAssignmentRules.FindAsync(id);
    public async Task<IEnumerable<MstLeadAssignmentRule>> GetAllAsync() => await _context.MstLeadAssignmentRules.ToListAsync();
    public IQueryable<MstLeadAssignmentRule> Query() => _context.MstLeadAssignmentRules.AsQueryable();
    public async Task AddAsync(MstLeadAssignmentRule entity) => await _context.MstLeadAssignmentRules.AddAsync(entity);
    public void Update(MstLeadAssignmentRule entity) => _context.MstLeadAssignmentRules.Update(entity);
    public void Delete(MstLeadAssignmentRule entity) => _context.MstLeadAssignmentRules.Remove(entity);

    public async Task<IEnumerable<MstLeadAssignmentRule>> GetActiveRulesOrderedAsync()
        => await _context.MstLeadAssignmentRules.Where(r => r.bolIsActive).Include(r => r.Members.Where(m => m.bolIsActive)).OrderBy(r => r.intPriority).ToListAsync();
}
