using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstLeadCommunicationRepository : IMstLeadCommunicationRepository
{
    private readonly CrmDbContext _context;

    public MstLeadCommunicationRepository(CrmDbContext context) => _context = context;

    public async Task<MstLeadCommunication?> GetByIdAsync(Guid id) => await _context.MstLeadCommunications.FindAsync(id);
    public async Task<IEnumerable<MstLeadCommunication>> GetAllAsync() => await _context.MstLeadCommunications.ToListAsync();
    public IQueryable<MstLeadCommunication> Query() => _context.MstLeadCommunications.AsQueryable();
    public async Task AddAsync(MstLeadCommunication entity) => await _context.MstLeadCommunications.AddAsync(entity);
    public void Update(MstLeadCommunication entity) => _context.MstLeadCommunications.Update(entity);
    public void Delete(MstLeadCommunication entity) => _context.MstLeadCommunications.Remove(entity);

    public async Task<IEnumerable<MstLeadCommunication>> GetByLeadIdAsync(Guid leadGuid)
        => await _context.MstLeadCommunications.Where(c => c.strLeadGUID == leadGuid).OrderByDescending(c => c.dtCreatedOn).ToListAsync();

    public async Task<MstLeadCommunication?> GetByTrackingPixelAsync(Guid trackingPixelGuid)
        => await _context.MstLeadCommunications.FirstOrDefaultAsync(c => c.strTrackingPixelGUID == trackingPixelGuid);
}
