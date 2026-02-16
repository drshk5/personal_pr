using Microsoft.EntityFrameworkCore;
using AuditSoftware.Models.Core;

namespace AuditSoftware.Data
{
    public class DbContexts : DbContext
    {
        public DbContexts(DbContextOptions<DbContexts> options) : base(options)
        {
        }

        public DbSet<MstUserActivityLog> MstUserActivityLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<MstUserActivityLog>(entity =>
            {
                entity.HasKey(e => e.ActivityLogGUID);
                entity.Property(e => e.ActivityType).IsRequired();
                entity.Property(e => e.UserGUID).IsRequired();
                entity.Property(e => e.GroupGUID).IsRequired();
            });
        }
    }
}