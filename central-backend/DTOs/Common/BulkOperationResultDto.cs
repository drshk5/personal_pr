using System;
using System.Collections.Generic;

namespace AuditSoftware.DTOs.Common
{
    /// <summary>
    /// Result of a bulk operation containing success and failure information
    /// </summary>
    public class BulkOperationResultDto
    {
        /// <summary>
        /// Number of items processed successfully
        /// </summary>
        public int SuccessCount { get; set; }
        
        /// <summary>
        /// Number of items that failed processing
        /// </summary>
        public int FailureCount { get; set; }
        
        /// <summary>
        /// Details of failed operations
        /// </summary>
        public List<BulkOperationFailure> Failures { get; set; } = new List<BulkOperationFailure>();
    }
    
    /// <summary>
    /// Information about a failed operation in a bulk process
    /// </summary>
    public class BulkOperationFailure
    {
        /// <summary>
        /// The ID of the item that failed
        /// </summary>
        public Guid ItemId { get; set; }
        
        /// <summary>
        /// The error message describing why the operation failed
        /// </summary>
        public string ErrorMessage { get; set; }
    }
}