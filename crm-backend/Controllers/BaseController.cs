using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using crm_backend.Extensions;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[ApiController]
[Authorize]
public abstract class BaseController : ControllerBase
{
    protected Guid GetUserGuid() => User.GetUserGuid();
    protected Guid GetGroupGuid() => User.GetGroupGuid();
    protected string GetUserName() => User.GetUserName();

    protected ActionResult<ApiResponse<T>> OkResponse<T>(T data, string message = "Success")
    {
        return Ok(ApiResponse<T>.Success(data, message));
    }

    protected ActionResult<ApiResponse<T>> CreatedResponse<T>(T data, string message = "Created successfully")
    {
        return StatusCode(201, new ApiResponse<T>
        {
            statusCode = 201,
            Message = message,
            Data = data
        });
    }

    protected ActionResult<ApiResponse<T>> ErrorResponse<T>(int statusCode, string message, string? errorCode = null)
    {
        return StatusCode(statusCode, ApiResponse<T>.Fail(statusCode, message, errorCode));
    }
}
