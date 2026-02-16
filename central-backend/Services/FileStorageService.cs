using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using AuditSoftware.Interfaces;

namespace AuditSoftware.Services
{
    public class FileStorageService :  ServiceBase, IFileStorageService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileStorageService> _logger;

        public FileStorageService(
            IWebHostEnvironment environment,
            ILogger<FileStorageService> logger)
        {
            _environment = environment;
            _logger = logger;
        }
        
        /// <summary>
        /// Creates a directory structure within the Uploads folder
        /// </summary>
        /// <param name="pathSegments">The path segments to create</param>
        /// <returns>The full path to the created directory</returns>
        public string CreateDirectoryStructure(params string[] pathSegments)
        {
            try
            {
                // Build the path starting from the Uploads directory
                List<string> segments = new List<string>();
                segments.Add(_environment.ContentRootPath);
                segments.Add("Uploads");
                segments.AddRange(pathSegments.Where(s => !string.IsNullOrWhiteSpace(s)));
                
                // Create the full path
                string fullPath = Path.Combine(segments.ToArray());
                
                // Create the directory if it doesn't exist
                if (!Directory.Exists(fullPath))
                {
                    Directory.CreateDirectory(fullPath);
                    _logger.LogInformation($"Created directory: {fullPath}");
                }
                else
                {
                    _logger.LogInformation($"Directory already exists: {fullPath}");
                }
                
                // Return the relative path (which will be used for storage or reference)
                var relativePath = "/Uploads/" + string.Join("/", pathSegments);
                return relativePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating directory structure");
                throw new Exception($"Error creating directory structure: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Saves an uploaded file to the specified directory
        /// </summary>
        /// <param name="file">The file to save</param>
        /// <param name="subDirectory">The subdirectory to save the file to</param>
        /// <returns>The relative path to the saved file</returns>
        public async Task<string> SaveFileAsync(IFormFile file, string subDirectory)
        {
            if (file == null || file.Length == 0)
            {
                return string.Empty;
            }

            try
            {
                // Create the directory if it doesn't exist
                var uploadsDir = Path.Combine(_environment.ContentRootPath, "Uploads", subDirectory);
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                // Generate a unique file name to prevent overwriting
                var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                var filePath = Path.Combine(uploadsDir, fileName);

                // Save the file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return the relative path to be stored in the database
                return $"/Uploads/{subDirectory}/{fileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving file {file.FileName}");
                throw new Exception($"Error saving file: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Deletes a file from storage
        /// </summary>
        /// <param name="filePath">The relative file path</param>
        public void DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
                return;

            try
            {
                // Convert relative path to absolute path
                var fullPath = Path.Combine(_environment.ContentRootPath, filePath.TrimStart('/'));
                
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    _logger.LogInformation($"File deleted: {filePath}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting file {filePath}");
                // Don't throw here to prevent breaking the main process
            }
        }
        
        /// <summary>
        /// Moves a file from its current location to a new directory
        /// </summary>
        /// <param name="sourceFilePath">The relative path to the source file</param>
        /// <param name="targetDirectory">The target subdirectory within Uploads folder</param>
        /// <returns>The new relative path to the file</returns>
        public async Task<string> MoveFileAsync(string sourceFilePath, string targetDirectory)
        {
            if (string.IsNullOrEmpty(sourceFilePath))
                throw new ArgumentException("Source file path cannot be empty", nameof(sourceFilePath));
            
            if (string.IsNullOrEmpty(targetDirectory))
                throw new ArgumentException("Target directory cannot be empty", nameof(targetDirectory));

            try
            {
                // Convert relative path to absolute path
                var fullSourcePath = Path.Combine(_environment.ContentRootPath, sourceFilePath.TrimStart('/'));
                
                // Check if source file exists
                if (!File.Exists(fullSourcePath))
                {
                    _logger.LogWarning($"Source file does not exist: {sourceFilePath}");
                    throw new FileNotFoundException($"Source file does not exist: {sourceFilePath}", fullSourcePath);
                }
                
                // Check if target directory exists, create only if it's a valid folder move operation
                var uploadsDir = Path.Combine(_environment.ContentRootPath, "Uploads", targetDirectory);
                if (!Directory.Exists(uploadsDir))
                {
                    // Only create the directory if we're sure this is the correct path
                    // Log a warning since this indicates the folder might not have been created properly
                    _logger.LogWarning($"Target directory does not exist, creating: {uploadsDir}");
                    Directory.CreateDirectory(uploadsDir);
                }
                
                // Get the file name from the source path
                var fileName = Path.GetFileName(fullSourcePath);
                
                // Generate the new path
                var newFilePath = Path.Combine(uploadsDir, fileName);
                
                // Move the file (using async File API)
                using (var sourceStream = new FileStream(fullSourcePath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, true))
                using (var destinationStream = new FileStream(newFilePath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, true))
                {
                    await sourceStream.CopyToAsync(destinationStream);
                }
                
                // Delete the source file after successful copy
                File.Delete(fullSourcePath);
                
                // Return the new relative path
                return $"/Uploads/{targetDirectory}/{fileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error moving file {sourceFilePath} to {targetDirectory}");
                throw new Exception($"Error moving file: {ex.Message}", ex);
            }
        }
        
        /// <summary>
        /// Deletes a directory and all its contents from storage
        /// </summary>
        /// <param name="directoryPath">The relative directory path</param>
        /// <returns>True if deletion was successful, false otherwise</returns>
        public bool DeleteDirectory(string directoryPath)
        {
            if (string.IsNullOrEmpty(directoryPath))
                return false;

            try
            {
                // Convert relative path to absolute path
                var fullPath = Path.Combine(_environment.ContentRootPath, directoryPath.TrimStart('/'));
                
                if (Directory.Exists(fullPath))
                {
                    // Delete directory and all its contents
                    Directory.Delete(fullPath, recursive: true);
                    _logger.LogInformation($"Directory deleted: {directoryPath}");
                    return true;
                }
                else
                {
                    _logger.LogWarning($"Directory not found: {directoryPath}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting directory {directoryPath}");
                return false;
            }
        }
    }
}

