using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstAuditLogRepository : IMstAuditLogRepository
{
    private readonly CrmDbContext _context;

    public MstAuditLogRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<MstAuditLog?> GetByIdAsync(Guid id) => await _context.MstAuditLogs.FindAsync(id);
    public async Task<IEnumerable<MstAuditLog>> GetAllAsync() => await _context.MstAuditLogs.ToListAsync();
    public IQueryable<MstAuditLog> Query() => _context.MstAuditLogs.AsQueryable();
    public async Task AddAsync(MstAuditLog entity) => await _context.MstAuditLogs.AddAsync(entity);
    public void Update(MstAuditLog entity) => _context.MstAuditLogs.Update(entity);
    public void Delete(MstAuditLog entity) => _context.MstAuditLogs.Remove(entity);
}
