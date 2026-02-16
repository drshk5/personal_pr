using Microsoft.AspNetCore.Authorization;
using AuditSoftware.Data;
using Microsoft.EntityFrameworkCore;

namespace AuditSoftware.Middleware;

public class SuperAdminRequirement : IAuthorizationRequirement { }

public class SuperAdminAuthorizationHandler : AuthorizationHandler<SuperAdminRequirement>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public SuperAdminAuthorizationHandler(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        SuperAdminRequirement requirement)
    {
        var emailClaim = context.User.FindFirst("strEmailId")?.Value;

        if (string.IsNullOrEmpty(emailClaim))
        {
            return;
        }

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var isSuperAdmin = await dbContext.MstUsers
            .AnyAsync(u => u.strEmailId == emailClaim && u.bolIsSuperAdmin);

        if (isSuperAdmin)
        {
            context.Succeed(requirement);
        }
    }
} 