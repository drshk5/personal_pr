using System.Threading.Tasks;

namespace AuditSoftware.Interfaces
{
    public interface IDeleteValidationService
    {
        /// <summary>
        /// Validates if a record can be deleted by checking dependencies in the v_delete_check view
        /// </summary>
        /// <param name="guid">The GUID of the record to delete</param>
        /// <param name="moduleType">The module name for context in error messages</param>
        /// <returns>Task that completes when validation is done</returns>
        Task ValidateDeleteAsync(string guid, string moduleType);
        
        /// <summary>
        /// Validates if a record can be deleted by checking dependencies in the v_delete_check view
        /// </summary>
        /// <param name="guid">The GUID of the record to delete</param>
        /// <param name="moduleType">The module name for context in error messages</param>
        /// <returns>Task that completes when validation is done</returns>
        Task ValidateDeleteAsync(System.Guid guid, string moduleType);
    }
}
