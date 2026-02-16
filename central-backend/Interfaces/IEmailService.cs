using System.Threading.Tasks;

namespace AuditSoftware.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task SendOtpEmailAsync(string to, string otp);
    }
} 