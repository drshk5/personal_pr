using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstWorkflowExecutionRepository : IMstWorkflowExecutionRepository
{
    private readonly CrmDbContext _context;

    public MstWorkflowExecutionRepository(CrmDbContext context) => _context = context;

    public async Task<MstWorkflowExecution?> GetByIdAsync(Guid id) => await _context.MstWorkflowExecutions.FindAsync(id);
    public async Task<IEnumerable<MstWorkflowExecution>> GetAllAsync() => await _context.MstWorkflowExecutions.ToListAsync();
    public IQueryable<MstWorkflowExecution> Query() => _context.MstWorkflowExecutions.AsQueryable();
    public async Task AddAsync(MstWorkflowExecution entity) => await _context.MstWorkflowExecutions.AddAsync(entity);
    public void Update(MstWorkflowExecution entity) => _context.MstWorkflowExecutions.Update(entity);
    public void Delete(MstWorkflowExecution entity) => _context.MstWorkflowExecutions.Remove(entity);

    public async Task<IEnumerable<MstWorkflowExecution>> GetPendingExecutionsAsync()
        => await _context.MstWorkflowExecutions.Where(e => e.strStatus == "Pending" && e.dtScheduledFor <= DateTime.UtcNow).Include(e => e.WorkflowRule).ToListAsync();

    public async Task<IEnumerable<MstWorkflowExecution>> GetByWorkflowRuleIdAsync(Guid ruleGuid)
        => await _context.MstWorkflowExecutions.Where(e => e.strWorkflowRuleGUID == ruleGuid).OrderByDescending(e => e.dtCreatedOn).ToListAsync();
}
