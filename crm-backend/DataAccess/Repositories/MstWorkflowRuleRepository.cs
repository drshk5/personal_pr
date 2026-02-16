using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstWorkflowRuleRepository : IMstWorkflowRuleRepository
{
    private readonly CrmDbContext _context;

    public MstWorkflowRuleRepository(CrmDbContext context) => _context = context;

    public async Task<MstWorkflowRule?> GetByIdAsync(Guid id) => await _context.MstWorkflowRules.FindAsync(id);
    public async Task<IEnumerable<MstWorkflowRule>> GetAllAsync() => await _context.MstWorkflowRules.ToListAsync();
    public IQueryable<MstWorkflowRule> Query() => _context.MstWorkflowRules.AsQueryable();
    public async Task AddAsync(MstWorkflowRule entity) => await _context.MstWorkflowRules.AddAsync(entity);
    public void Update(MstWorkflowRule entity) => _context.MstWorkflowRules.Update(entity);
    public void Delete(MstWorkflowRule entity) => _context.MstWorkflowRules.Remove(entity);

    public async Task<IEnumerable<MstWorkflowRule>> GetActiveRulesByTriggerAsync(string entityType, string triggerEvent)
        => await _context.MstWorkflowRules.Where(r => r.bolIsActive && r.strEntityType == entityType && r.strTriggerEvent == triggerEvent).ToListAsync();
}
