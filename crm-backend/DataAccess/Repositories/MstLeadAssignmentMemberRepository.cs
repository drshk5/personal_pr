using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstLeadAssignmentMemberRepository : IMstLeadAssignmentMemberRepository
{
    private readonly CrmDbContext _context;

    public MstLeadAssignmentMemberRepository(CrmDbContext context) => _context = context;

    public async Task<MstLeadAssignmentMember?> GetByIdAsync(Guid id) => await _context.MstLeadAssignmentMembers.FindAsync(id);
    public async Task<IEnumerable<MstLeadAssignmentMember>> GetAllAsync() => await _context.MstLeadAssignmentMembers.ToListAsync();
    public IQueryable<MstLeadAssignmentMember> Query() => _context.MstLeadAssignmentMembers.AsQueryable();
    public async Task AddAsync(MstLeadAssignmentMember entity) => await _context.MstLeadAssignmentMembers.AddAsync(entity);
    public void Update(MstLeadAssignmentMember entity) => _context.MstLeadAssignmentMembers.Update(entity);
    public void Delete(MstLeadAssignmentMember entity) => _context.MstLeadAssignmentMembers.Remove(entity);

    public async Task<IEnumerable<MstLeadAssignmentMember>> GetByRuleIdAsync(Guid ruleGuid)
        => await _context.MstLeadAssignmentMembers.Where(m => m.strAssignmentRuleGUID == ruleGuid).ToListAsync();

    public async Task<IEnumerable<MstLeadAssignmentMember>> GetActiveMembersByRuleIdAsync(Guid ruleGuid)
        => await _context.MstLeadAssignmentMembers.Where(m => m.strAssignmentRuleGUID == ruleGuid && m.bolIsActive).ToListAsync();
}
