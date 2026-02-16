using AuditSoftware.Data;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AuditSoftware.Services
{
    public class DeleteValidationService :  ServiceBase, IDeleteValidationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DeleteValidationService> _logger;

        public DeleteValidationService(AppDbContext context, ILogger<DeleteValidationService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Validates if a record can be deleted by checking dependencies in the v_delete_check view
        /// </summary>
        /// <param name="guid">The GUID of the record to delete</param>
        /// <param name="moduleType">The module name for context in error messages</param>
        /// <returns>Task that completes when validation is done</returns>
        /// <exception cref="BusinessException">Thrown when the record cannot be deleted due to dependencies</exception>
        public async Task ValidateDeleteAsync(Guid guid, string moduleType)
        {
            await ValidateDeleteAsync(guid.ToString(), moduleType);
        }

        /// <summary>
        /// Validates if a record can be deleted by checking dependencies in the v_delete_check view
        /// </summary>
        /// <param name="guid">The GUID of the record to delete</param>
        /// <param name="moduleType">The module name for context in error messages</param>
        /// <returns>Task that completes when validation is done</returns>
        /// <exception cref="BusinessException">Thrown when the record cannot be deleted due to dependencies</exception>
        public async Task ValidateDeleteAsync(string guid, string moduleType)
        {
            try
            {
                // SET BREAKPOINT HERE FOR DEBUGGING DELETE VALIDATION
                _logger.LogInformation($"Validating delete for {moduleType} with GUID: {guid}");
                
                // First try to directly query for dependencies with the exact GUID to debug
                try
                {
                    var directDependencyQuery = $@"
                        SELECT strDatabase, strForeignkey, strModule 
                        FROM v_delete_check 
                        WHERE strForeignkey = '{guid}'";
                    
                    _logger.LogInformation($"Running direct dependency check query: {directDependencyQuery}");
                    
                    var rawDependencies = await _context.Database
                        .SqlQueryRaw<DependencyCheckResult>(directDependencyQuery)
                        .ToListAsync();
                    
                    if (rawDependencies.Any())
                    {
                        _logger.LogWarning($"Direct query found {rawDependencies.Count} dependencies");
                        foreach (var dep in rawDependencies)
                        {
                            _logger.LogWarning($"Dependency found: Database={dep.strDatabase}, Module={dep.strModule}, ForeignKey={dep.strForeignkey}");
                            // If we found dependencies, let's throw the exception right away
                            var errorMessage = $"Cannot delete this {moduleType} because it is referenced in: {string.Join(", ", rawDependencies.Select(d => d.strModule))}";
                            throw new BusinessException(errorMessage);
                        }
                    }
                    else
                    {
                        _logger.LogInformation("Direct query found no dependencies");
                    }
                }
                catch (BusinessException)
                {
                    // Rethrow business exceptions
                    throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error executing direct dependency check");
                    // Continue to try the other methods of checking
                }
                
                // First get all column names from the view for debugging
                var getAllColumnsQuery = @"
                    SELECT COLUMN_NAME
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'v_delete_check'
                    ORDER BY COLUMN_NAME";
                
                _logger.LogInformation("Getting all columns in v_delete_check view for debugging");
                try 
                {
                    var allColumns = await _context.Database
                        .SqlQueryRaw<ColumnInfo>(getAllColumnsQuery)
                        .ToListAsync();
                    
                    _logger.LogInformation($"Found {allColumns.Count} columns in v_delete_check:");
                    foreach(var column in allColumns)
                    {
                        _logger.LogInformation($"Column found: {column.COLUMN_NAME}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to get all columns: {ex.Message}");
                }
                
                // Now try to get the foreign key column name - use the exact column name from your SQL query
                // Use 'strForeignkey' (lowercase k) as confirmed in your SQL query
                const string FOREIGN_KEY_COLUMN = "strForeignkey";
                
                _logger.LogInformation($"Using hardcoded foreign key column name: {FOREIGN_KEY_COLUMN}");
                
                // Also try to verify the column exists in the view
                var checkViewQuery = @"
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'v_delete_check'
                    AND COLUMN_NAME = 'strForeignkey'";
                
                try 
                {
                    // Verify column exists
                    var columnCount = await _context.Database
                        .SqlQueryRaw<int>(checkViewQuery)
                        .FirstOrDefaultAsync();
                    
                    _logger.LogInformation($"Column 'strForeignkey' exists: {columnCount > 0}");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to verify column existence: {ex.Message}");
                    _logger.LogWarning($"Exception details: {ex}");
                }

                // First, check if the view exists before trying to query it
                try 
                {
                    var viewExistsQuery = @"SELECT COUNT(*) FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME = 'v_delete_check'";
                    var viewExists = await _context.Database
                        .SqlQueryRaw<int>(viewExistsQuery)
                        .ToListAsync();
                    
                    if (viewExists.Count > 0 && viewExists[0] > 0)
                    {
                        _logger.LogInformation("v_delete_check view exists, proceeding with validation");
                    }
                    else
                    {
                        _logger.LogError("v_delete_check view does not exist");
                        throw new BusinessException("Cannot perform delete validation because the required database view 'v_delete_check' doesn't exist");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error checking if view exists");
                    throw new BusinessException($"Cannot perform delete validation: {ex.Message}");
                }
                
                // Use the confirmed column name
                string whereClause = $"{FOREIGN_KEY_COLUMN} = {{0}}";
                
                // Let's first check if the record exists in the view directly
                var checkDependenciesQuery = $@"
                    SELECT COUNT(*) 
                    FROM v_delete_check 
                    WHERE {whereClause}";
                
                _logger.LogInformation($"Checking if any dependencies exist with query: {checkDependenciesQuery}");
                _logger.LogInformation($"Using GUID: {guid}");
                
                int dependencyCount = 0;
                try
                {
                    // Check if the view exists first
                    var checkViewExistsQuery = @"SELECT COUNT(*) FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME = 'v_delete_check'";
                    var viewExists = await _context.Database
                        .SqlQueryRaw<int>(checkViewExistsQuery)
                        .FirstOrDefaultAsync();
                    
                    if (viewExists == 0)
                    {
                        _logger.LogError("v_delete_check view does not exist");
                        throw new BusinessException("Cannot perform delete validation because the required database view 'v_delete_check' doesn't exist");
                    }
                    
                    // Use ToList to ensure we get a result and safely handle empty sequences
                    var countResult = await _context.Database
                        .SqlQueryRaw<int>(checkDependenciesQuery, guid)
                        .ToListAsync();
                    
                    // Get the first result or default to 0 if no results
                    dependencyCount = countResult.Any() ? countResult.First() : 0;
                    
                    _logger.LogInformation($"Found {dependencyCount} dependencies for GUID {guid}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error checking dependency count");
                    _logger.LogWarning($"Continuing without dependency check due to error: {ex.Message}");
                    return; // Skip further checks instead of throwing exception
                }
                
                // Only proceed with aggregating the dependencies if we have any
                if (dependencyCount > 0)
                {
                    var dependencyQuery = $@"
                        SELECT 
                            strDatabase,
                            STRING_AGG(strModule, ', ') AS DependentModules
                        FROM 
                            v_delete_check
                        WHERE 
                            {whereClause}
                        GROUP BY 
                            strDatabase";

                    _logger.LogInformation($"Executing dependency query: {dependencyQuery}");
                    
                    List<DependencyResult> dependencies;
                    try
                    {
                        dependencies = await _context.Database
                            .SqlQueryRaw<DependencyResult>(dependencyQuery, guid)
                            .ToListAsync();
                        
                        _logger.LogInformation($"Dependency query returned {dependencies.Count} results");
                        
                        if (dependencies.Any())
                        {
                            // Create a comma-separated list of dependent modules, handling nulls safely
                            var dependentModules = string.Join(", ", dependencies
                                .Where(d => d.DependentModules != null)
                                .Select(d => d.DependentModules ?? string.Empty));
                            
                            var errorMessage = $"Cannot delete this {moduleType} because it is referenced in: {dependentModules}";
                            
                            _logger.LogWarning($"Delete validation failed: {errorMessage}");
                            throw new BusinessException(errorMessage);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error executing dependency query");
                        // Rethrow as BusinessException so caller knows about the issue
                        throw new BusinessException($"Error checking dependencies: {ex.Message}");
                    }
                }

                _logger.LogInformation($"Delete validation passed for {moduleType} with GUID: {guid}");
            }
            catch (BusinessException)
            {
                // Re-throw business exceptions as they already have the appropriate message
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating delete for {moduleType} with GUID: {guid}");
                throw new BusinessException($"Error checking dependencies: {ex.Message}");
            }
        }

        private class DependencyResult
        {
            public string? strDatabase { get; set; }
            public string? DependentModules { get; set; }
        }

        private class ColumnInfo
        {
            public string? COLUMN_NAME { get; set; }
        }
        
        private class DependencyCheckResult
        {
            public string? strDatabase { get; set; }
            public string? strForeignkey { get; set; }
            public string? strModule { get; set; }
        }
    }
}

