using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstWebFormSubmissionRepository : IMstWebFormSubmissionRepository
{
    private readonly CrmDbContext _context;

    public MstWebFormSubmissionRepository(CrmDbContext context) => _context = context;

    public async Task<MstWebFormSubmission?> GetByIdAsync(Guid id) => await _context.MstWebFormSubmissions.FindAsync(id);
    public async Task<IEnumerable<MstWebFormSubmission>> GetAllAsync() => await _context.MstWebFormSubmissions.ToListAsync();
    public IQueryable<MstWebFormSubmission> Query() => _context.MstWebFormSubmissions.AsQueryable();
    public async Task AddAsync(MstWebFormSubmission entity) => await _context.MstWebFormSubmissions.AddAsync(entity);
    public void Update(MstWebFormSubmission entity) => _context.MstWebFormSubmissions.Update(entity);
    public void Delete(MstWebFormSubmission entity) => _context.MstWebFormSubmissions.Remove(entity);

    public async Task<IEnumerable<MstWebFormSubmission>> GetByFormIdAsync(Guid formGuid)
        => await _context.MstWebFormSubmissions.Where(s => s.strWebFormGUID == formGuid).OrderByDescending(s => s.dtCreatedOn).ToListAsync();
}
