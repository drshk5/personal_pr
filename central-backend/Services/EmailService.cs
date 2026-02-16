using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using AuditSoftware.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AuditSoftware.Services
{
    public class EmailService :  ServiceBase, IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUsername;
        private readonly string _smtpPassword;
        private readonly string _fromEmail;
        private readonly string _fromName = "Audit Software";  // Default value

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _smtpHost = _configuration["Email:SmtpHost"] ?? throw new ArgumentNullException(nameof(_smtpHost));
            _smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            _smtpUsername = _configuration["Email:SmtpUsername"] ?? throw new ArgumentNullException(nameof(_smtpUsername));
            _smtpPassword = _configuration["Email:SmtpPassword"] ?? throw new ArgumentNullException(nameof(_smtpPassword));
            _fromEmail = _configuration["Email:FromEmail"] ?? throw new ArgumentNullException(nameof(_fromEmail));
            var configFromName = _configuration["Email:FromName"];
            if (!string.IsNullOrEmpty(configFromName))
            {
                _fromName = configFromName;
            }
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var message = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                message.To.Add(to);

                using var client = new SmtpClient(_smtpHost, _smtpPort)
                {
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    EnableSsl = true
                };

                await client.SendMailAsync(message);
            }
            catch (Exception ex)
            {
                // Log the error
                throw new Exception($"Failed to send email: {ex.Message}");
            }
        }

        public async Task SendOtpEmailAsync(string to, string otp)
        {
            var subject = "Password Reset OTP";
            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #333;'>Password Reset Request</h2>
                        <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
                        <div style='background-color: #f5f5f5; padding: 15px; margin: 20px 0; text-align: center;'>
                            <h1 style='color: #007bff; margin: 0; letter-spacing: 5px;'>{otp}</h1>
                        </div>
                        <p>This OTP will expire in 15 minutes.</p>
                        <p style='color: #666; font-size: 14px;'>If you didn't request this password reset, please ignore this email.</p>
                        <hr style='border: 1px solid #eee; margin: 20px 0;'>
                        <p style='color: #999; font-size: 12px;'>This is an automated message, please do not reply.</p>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(to, subject, body);
        }
    }
} 
