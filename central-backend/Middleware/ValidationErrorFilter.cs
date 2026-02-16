using AuditSoftware.DTOs.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AuditSoftware.Middleware
{
    public class ValidationErrorFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            // Check if the model state is valid
            if (!context.ModelState.IsValid)
            {
                // Get the first error message
                var errorEntry = context.ModelState.Values
                    .SelectMany(v => v.Errors)
                    .FirstOrDefault();

                string errorMessage = errorEntry?.ErrorMessage ?? "Validation failed";

                // Create a response in the desired format
                var response = new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = errorMessage
                };

                // Set the result
                context.Result = new BadRequestObjectResult(response);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // No action needed after execution
        }
    }
} 
