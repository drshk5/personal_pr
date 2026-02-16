using AuditSoftware.DTOs.Common;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace AuditSoftware.Controllers
{
    /// <summary>
    /// Base controller class that provides deletion validation functionality
    /// </summary>
    /// <typeparam name="T">The entity type to be deleted</typeparam>
    public abstract class BaseDeletionController<T> : ControllerBase where T : class
    {
        protected readonly IDeleteValidationService _deleteValidationService;
        protected readonly ILogger<BaseDeletionController<T>> _logger;
        
        protected BaseDeletionController(
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<T>> logger)
        {
            _deleteValidationService = deleteValidationService ?? throw new ArgumentNullException(nameof(deleteValidationService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }
        
        /// <summary>
        /// Validate if an entity can be deleted
        /// </summary>
        /// <param name="guid">The entity GUID</param>
        /// <param name="moduleName">The module name for error messages</param>
        /// <returns>Action result indicating success or providing error details</returns>
        protected async Task<ActionResult> ValidateDeleteAsync(Guid guid, string moduleName)
        {
            try
            {
                await _deleteValidationService.ValidateDeleteAsync(guid.ToString(), moduleName);
                return null; // Validation passed
            }
            catch (BusinessException ex)
            {
                return BadRequest(ApiResponse<bool>.Fail(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating delete for {moduleName} with GUID {guid}");
                return StatusCode(500, ApiResponse<bool>.Fail(500, $"An error occurred while validating delete for {moduleName}"));
            }
        }
        
        /// <summary>
        /// Delete an entity after validating dependencies
        /// </summary>
        /// <param name="guid">The entity GUID</param>
        /// <param name="moduleName">The module name for error messages</param>
        /// <param name="deleteAction">The action that performs the actual deletion</param>
        /// <returns>Action result indicating success or providing error details</returns>
        protected async Task<ActionResult> SafeDeleteAsync(
            Guid guid, 
            string moduleName, 
            Func<Guid, Task<bool>> deleteAction)
        {
            try
            {
                // First validate if the entity can be deleted
                var validationResult = await ValidateDeleteAsync(guid, moduleName);
                if (validationResult != null)
                {
                    return validationResult; // Return the validation error
                }
                
                // If validation passes, perform the delete action
                var result = await deleteAction(guid);
                
                if (!result)
                {
                    return NotFound(new { statusCode = 404, Message = $"{moduleName} not found" });
                }
                
                return Ok(new { statusCode = 200, Message = $"{moduleName} deleted successfully" });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting {moduleName} with GUID {guid}");
                return StatusCode(500, new { statusCode = 500, Message = $"An error occurred while deleting {moduleName}" });
            }
        }
    }
}
