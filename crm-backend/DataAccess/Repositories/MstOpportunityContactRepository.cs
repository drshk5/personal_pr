using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstOpportunityContactRepository : IMstOpportunityContactRepository
{
    private readonly CrmDbContext _context;

    public MstOpportunityContactRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<MstOpportunityContact?> GetByIdAsync(Guid id) => await _context.MstOpportunityContacts.FindAsync(id);
    public async Task<IEnumerable<MstOpportunityContact>> GetAllAsync() => await _context.MstOpportunityContacts.ToListAsync();
    public IQueryable<MstOpportunityContact> Query() => _context.MstOpportunityContacts.AsQueryable();
    public async Task AddAsync(MstOpportunityContact entity) => await _context.MstOpportunityContacts.AddAsync(entity);
    public void Update(MstOpportunityContact entity) => _context.MstOpportunityContacts.Update(entity);
    public void Delete(MstOpportunityContact entity) => _context.MstOpportunityContacts.Remove(entity);
}
