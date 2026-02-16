using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace crm_backend.Controllers;

[ApiController]
[Route("api/crm/status")]
[AllowAnonymous]
public class ServiceStatusController : ControllerBase
{
    [HttpGet]
    public IActionResult GetStatus()
    {
        return Ok(new
        {
            statusCode = 200,
            service = "CRM Backend",
            status = "Healthy",
            version = "1.0.0",
            timestamp = DateTime.UtcNow
        });
    }
}
