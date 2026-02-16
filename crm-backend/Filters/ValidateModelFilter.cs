using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using crm_backend.Models.Wrappers;

namespace crm_backend.Filters;

public class ValidateModelFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            var errors = context.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            var errorMessage = errors.FirstOrDefault() ?? "Validation failed";

            context.Result = new UnprocessableEntityObjectResult(
                ApiResponse<object>.Fail(422, errorMessage));
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}
