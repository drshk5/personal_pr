using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstLeadRepository : IMstLeadRepository
{
    private readonly CrmDbContext _context;

    public MstLeadRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<MstLead?> GetByIdAsync(Guid id)
    {
        return await _context.MstLeads.FindAsync(id);
    }

    public async Task<IEnumerable<MstLead>> GetAllAsync()
    {
        return await _context.MstLeads.ToListAsync();
    }

    public IQueryable<MstLead> Query()
    {
        return _context.MstLeads.AsQueryable();
    }

    public IQueryable<MstLead> QueryIncludingDeleted()
    {
        return _context.MstLeads.IgnoreQueryFilters().AsQueryable();
    }

    public async Task AddAsync(MstLead entity)
    {
        await _context.MstLeads.AddAsync(entity);
    }

    public void Update(MstLead entity)
    {
        _context.MstLeads.Update(entity);
    }

    public void Delete(MstLead entity)
    {
        _context.MstLeads.Remove(entity);
    }

    public async Task<MstLead?> GetByEmailAsync(string email, Guid groupGuid)
    {
        return await _context.MstLeads
            .FirstOrDefaultAsync(l => l.strEmail.ToLower() == email.ToLower());
    }

    public async Task<IEnumerable<MstLead>> GetByStatusAsync(string status)
    {
        return await _context.MstLeads
            .Where(l => l.strStatus == status)
            .ToListAsync();
    }
}
