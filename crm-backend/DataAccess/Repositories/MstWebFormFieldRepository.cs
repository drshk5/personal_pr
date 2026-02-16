using Microsoft.EntityFrameworkCore;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Repositories;

public class MstWebFormFieldRepository : IMstWebFormFieldRepository
{
    private readonly CrmDbContext _context;

    public MstWebFormFieldRepository(CrmDbContext context) => _context = context;

    public async Task<MstWebFormField?> GetByIdAsync(Guid id) => await _context.MstWebFormFields.FindAsync(id);
    public async Task<IEnumerable<MstWebFormField>> GetAllAsync() => await _context.MstWebFormFields.ToListAsync();
    public IQueryable<MstWebFormField> Query() => _context.MstWebFormFields.AsQueryable();
    public async Task AddAsync(MstWebFormField entity) => await _context.MstWebFormFields.AddAsync(entity);
    public void Update(MstWebFormField entity) => _context.MstWebFormFields.Update(entity);
    public void Delete(MstWebFormField entity) => _context.MstWebFormFields.Remove(entity);

    public async Task<IEnumerable<MstWebFormField>> GetByFormIdAsync(Guid formGuid)
        => await _context.MstWebFormFields.Where(f => f.strWebFormGUID == formGuid).OrderBy(f => f.intSortOrder).ToListAsync();
}
