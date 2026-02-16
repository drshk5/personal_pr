using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using AuditSoftware.Data;
using System.Linq;

namespace AuditSoftware.Services
{
    public class SessionCleanupHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SessionCleanupHostedService> _logger;

        public SessionCleanupHostedService(IServiceProvider serviceProvider, ILogger<SessionCleanupHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Session cleanup background service starting");

            var delay = TimeSpan.FromHours(1); // run hourly

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    var cutoff = DateTime.UtcNow.AddDays(-7); // keep recent 7 days

                    var staleSessions = db.MstUserSessions
                        .Where(s => (s.dtExpiresAt.HasValue && s.dtExpiresAt < cutoff) ||
                                    (!s.bolIsActive && s.dtRevokedOn.HasValue && s.dtRevokedOn < cutoff));

                    var count = await Task.FromResult(staleSessions.Count());
                    if (count > 0)
                    {
                        db.MstUserSessions.RemoveRange(staleSessions);
                        await db.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation("Session cleanup removed {count} stale sessions", count);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while cleaning up sessions");
                }

                await Task.Delay(delay, stoppingToken);
            }
        }
    }
}
