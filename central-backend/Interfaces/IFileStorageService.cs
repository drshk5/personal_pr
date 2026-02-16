using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace AuditSoftware.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(IFormFile file, string subDirectory);
        void DeleteFile(string filePath);
        string CreateDirectoryStructure(params string[] pathSegments);
        Task<string> MoveFileAsync(string sourceFilePath, string targetDirectory);
        bool DeleteDirectory(string directoryPath);
    }
}
