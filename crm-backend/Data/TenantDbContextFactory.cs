using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace crm_backend.Data;

public class TenantDbContextFactory : IDesignTimeDbContextFactory<CrmDbContext>
{
    public CrmDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<CrmDbContext>();
        optionsBuilder.UseSqlServer("Server=192.168.1.101\\SQLEXPRESS;Database=MasterDB;User Id=sa;Password=De$ktop;TrustServerCertificate=True;");

        var tenantProvider = new DesignTimeTenantContextProvider();
        return new CrmDbContext(optionsBuilder.Options, tenantProvider);
    }

    private class DesignTimeTenantContextProvider : ITenantContextProvider
    {
        public Guid GetTenantId() => Guid.Empty;
        public Guid GetCurrentUserId() => Guid.Empty;
        public string GetCurrentUserName() => "DesignTime";
        public Guid GetOrganizationId() => Guid.Empty;
        public Guid GetModuleId() => Guid.Empty;
    }
}
