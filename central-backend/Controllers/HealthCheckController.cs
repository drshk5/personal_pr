using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using AuditSoftware.Data;

namespace AuditSoftware.Controllers
{
    public class HealthCheck
    {
        public required string Name { get; set; }
        public required string Status { get; set; }
        public required string Description { get; set; }
        public required string Duration { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class HealthCheckController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HealthCheckController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get()
        {
            var checks = new List<HealthCheck>();
            var overallStatus = "Healthy";

            // Database health check
            var dbCheck = await CheckDatabaseHealthAsync();
            checks.Add(dbCheck);
            if (dbCheck.Status != "Healthy")
            {
                overallStatus = "Unhealthy";
            }

            // Self check
            var selfCheck = CheckSelfHealth();
            checks.Add(selfCheck);
            if (selfCheck.Status != "Healthy")
            {
                overallStatus = "Unhealthy";
            }

            return Ok(new
            {
                status = overallStatus,
                checks = checks
            });
        }

        private async Task<HealthCheck> CheckDatabaseHealthAsync()
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                await _context.Database.CanConnectAsync();
                stopwatch.Stop();
                return new HealthCheck
                {
                    Name = "database",
                    Status = "Healthy",
                    Description = "",
                    Duration = stopwatch.Elapsed.ToString()
                };
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                return new HealthCheck
                {
                    Name = "database",
                    Status = "Unhealthy",
                    Description = ex.Message,
                    Duration = stopwatch.Elapsed.ToString()
                };
            }
        }

        private HealthCheck CheckSelfHealth()
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                stopwatch.Stop();
                return new HealthCheck
                {
                    Name = "self",
                    Status = "Healthy",
                    Description = "API is running",
                    Duration = stopwatch.Elapsed.ToString()
                };
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                return new HealthCheck
                {
                    Name = "self",
                    Status = "Unhealthy",
                    Description = ex.Message,
                    Duration = stopwatch.Elapsed.ToString()
                };
            }
        }
    }
}


