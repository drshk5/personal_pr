using System.Collections.Concurrent;
using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using crm_backend.Data;
using crm_backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace crm_backend.Services;

/// <summary>
/// High-performance email notification service with queue-based bulk sending
/// </summary>
public class EmailNotificationService : IEmailNotificationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailNotificationService> _logger;
    private readonly CrmDbContext _context;
    private readonly string _smtpHost;
    private readonly int _smtpPort;
    private readonly string _smtpUsername;
    private readonly string _smtpPassword;
    private readonly string _fromEmail;
    private readonly string _fromName;
    private readonly bool _enableEmail;
    
    // Queue for bulk email processing
    private static readonly ConcurrentQueue<EmailDto> _emailQueue = new();
    private static readonly SemaphoreSlim _queueSemaphore = new(1, 1);
    private static bool _isProcessing = false;

    public EmailNotificationService(
        IConfiguration configuration,
        ILogger<EmailNotificationService> logger,
        CrmDbContext context)
    {
        _configuration = configuration;
        _logger = logger;
        _context = context;

        _enableEmail = _configuration.GetValue<bool>("Email:Enabled", false);
        _smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
        _smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
        _smtpUsername = _configuration["Email:SmtpUsername"] ?? "";
        _smtpPassword = _configuration["Email:SmtpPassword"] ?? "";
        _fromEmail = _configuration["Email:FromEmail"] ?? "";
        _fromName = _configuration["Email:FromName"] ?? "CRM System";
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  ACTIVITY NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    public Task SendActivityAssignedNotificationAsync(Guid activityId, Guid userId, string activitySubject)
    {
        try
        {
            // Note: In production, fetch user from MasterDbContext
            // For now, using placeholder to prevent build errors
            _logger.LogWarning("Email sending requires MasterDbContext integration for user {UserId}", userId);
            
            // TODO: Inject MasterDbContext and fetch user properly
            // var user = await _masterContext.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == userId);
            
            var subject = $"New Activity Assigned: {activitySubject}";
            var body = GenerateActivityAssignedEmail("User", activitySubject, activityId);

            // await SendEmailAsync(user.strEmail, user.strName, subject, body);
            _logger.LogInformation("Activity assignment email prepared for activity {ActivityId}", activityId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send activity assignment notification");
        }
        
        return Task.CompletedTask;
    }

    public async Task SendBulkActivityNotificationsAsync(List<Guid> activityIds, List<Guid> userIds)
    {
        try
        {
            // Get activity details
            var activities = await _context.Set<Models.Core.CustomerData.MstActivity>()
                .Where(a => activityIds.Contains(a.strActivityGUID))
                .ToListAsync();

            // Note: User details should be fetched from MasterDbContext or passed as parameter
            // For now, we'll just use activity data without user lookup

            // Queue emails for batch processing
            // Note: This is a simplified version. In production, you'd need to fetch user emails
            // from MasterDbContext or have them passed as parameters
            foreach (var activity in activities)
            {
                if (activity.strAssignedToGUID.HasValue)
                {
                    var emailDto = new EmailDto
                    {
                        ToEmail = "placeholder@example.com", // TODO: Fetch from MasterDbContext
                        ToName = "User",
                        Subject = $"New Activity Assigned: {activity.strSubject}",
                        Body = GenerateActivityAssignedEmail("User", activity.strSubject, activity.strActivityGUID),
                        IsHtml = true
                    };
                    _emailQueue.Enqueue(emailDto);
                }
            }

            // Start background processing
            _ = ProcessEmailQueueAsync();

            _logger.LogInformation("Queued {Count} activity notification emails", activities.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to queue bulk activity notifications");
        }
    }

    public async Task SendActivityStatusChangeNotificationAsync(Guid activityId, string oldStatus, string newStatus)
    {
        try
        {
            var activity = await _context.Set<Models.Core.CustomerData.MstActivity>()
                .FirstOrDefaultAsync(a => a.strActivityGUID == activityId);

            if (activity == null)
                return;

            var subject = $"Activity Status Updated: {activity.strSubject}";
            var body = GenerateActivityStatusChangeEmail(
                "User",
                activity.strSubject,
                oldStatus,
                newStatus,
                activityId);

            // TODO: Fetch user from MasterDbContext and send email
            _logger.LogInformation("Activity status change notification prepared for {ActivityId}", activityId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send activity status change notification");
        }
    }

    public async Task SendActivityReminderAsync(Guid activityId, Guid userId)
    {
        try
        {
            var activity = await _context.Set<Models.Core.CustomerData.MstActivity>()
                .FirstOrDefaultAsync(a => a.strActivityGUID == activityId);

            if (activity == null)
                return;

            var subject = $"Activity Reminder: {activity.strSubject}";
            var body = GenerateActivityReminderEmail(
                "User",
                activity.strSubject,
                activity.dtDueDate,
                activityId);

            // TODO: Fetch user from MasterDbContext and send email
            _logger.LogInformation("Activity reminder notification prepared for {ActivityId}", activityId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send activity reminder");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  CUSTOM EMAIL SENDING
    // ═══════════════════════════════════════════════════════════════════════════

    public async Task SendCustomEmailAsync(EmailDto emailDto)
    {
        await SendEmailAsync(emailDto.ToEmail, emailDto.ToName, emailDto.Subject, emailDto.Body);
    }

    public Task SendBulkCustomEmailsAsync(List<EmailDto> emails)
    {
        foreach (var email in emails)
        {
            _emailQueue.Enqueue(email);
        }

        // Start background processing
        _ = ProcessEmailQueueAsync();

        _logger.LogInformation("Queued {Count} custom emails for sending", emails.Count);
        
        return Task.CompletedTask;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  CORE EMAIL SENDING
    // ═══════════════════════════════════════════════════════════════════════════

    private async Task SendEmailAsync(string toEmail, string toName, string subject, string body)
    {
        if (!_enableEmail)
        {
            _logger.LogInformation("Email disabled. Would send to {Email}: {Subject}", toEmail, subject);
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_fromEmail, _fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            message.To.Add(new MailAddress(toEmail, toName));

            using var client = new SmtpClient(_smtpHost, _smtpPort)
            {
                Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                EnableSsl = true
            };

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            throw;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  BACKGROUND QUEUE PROCESSING
    // ═══════════════════════════════════════════════════════════════════════════

    private async Task ProcessEmailQueueAsync()
    {
        // Prevent multiple concurrent processing
        if (_isProcessing) return;

        await _queueSemaphore.WaitAsync();
        try
        {
            if (_isProcessing) return;
            _isProcessing = true;

            var batchSize = _configuration.GetValue<int>("Email:BatchSize", 50);
            var delayBetweenBatches = _configuration.GetValue<int>("Email:DelayBetweenBatchesMs", 1000);

            var batch = new List<EmailDto>();
            while (_emailQueue.TryDequeue(out var email))
            {
                batch.Add(email);

                if (batch.Count >= batchSize)
                {
                    await SendBatchAsync(batch);
                    batch.Clear();
                    await Task.Delay(delayBetweenBatches);
                }
            }

            // Send remaining emails
            if (batch.Any())
            {
                await SendBatchAsync(batch);
            }

            _logger.LogInformation("Email queue processing completed");
        }
        finally
        {
            _isProcessing = false;
            _queueSemaphore.Release();
        }
    }

    private async Task SendBatchAsync(List<EmailDto> batch)
    {
        var tasks = batch.Select(async email =>
        {
            try
            {
                await SendEmailAsync(email.ToEmail, email.ToName, email.Subject, email.Body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email in batch to {Email}", email.ToEmail);
            }
        });

        await Task.WhenAll(tasks);
        _logger.LogInformation("Sent batch of {Count} emails", batch.Count);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  EMAIL TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════════

    private string GenerateActivityAssignedEmail(string userName, string activitySubject, Guid activityId)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }}
        .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>New Activity Assigned</h1>
        </div>
        <div class=""content"">
            <p>Hi {userName},</p>
            <p>A new activity has been assigned to you:</p>
            <div style=""background-color: #f0f0f0; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0;"">
                <h3 style=""margin: 0 0 10px 0;"">{activitySubject}</h3>
            </div>
            <p>Please review and complete this activity at your earliest convenience.</p>
            <a href=""#/crm/activities?id={activityId}"" class=""button"">View Activity</a>
        </div>
        <div class=""footer"">
            <p>This is an automated message from your CRM system. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GenerateActivityStatusChangeEmail(string userName, string activitySubject, string oldStatus, string newStatus, Guid activityId)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }}
        .header {{ background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }}
        .status-badge {{ display: inline-block; padding: 5px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; }}
        .status-old {{ background-color: #FEE2E2; color: #DC2626; }}
        .status-new {{ background-color: #D1FAE5; color: #059669; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>Activity Status Updated</h1>
        </div>
        <div class=""content"">
            <p>Hi {userName},</p>
            <p>The status of your activity has been updated:</p>
            <div style=""background-color: #f0f0f0; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0;"">
                <h3 style=""margin: 0 0 10px 0;"">{activitySubject}</h3>
                <p style=""margin: 10px 0;"">
                    Status changed from <span class=""status-badge status-old"">{oldStatus}</span> 
                    to <span class=""status-badge status-new"">{newStatus}</span>
                </p>
            </div>
            <a href=""#/crm/activities?id={activityId}"" class=""button"">View Activity</a>
        </div>
    </div>
</body>
</html>";
    }

    private string GenerateActivityReminderEmail(string userName, string activitySubject, DateTime? dueDate, Guid activityId)
    {
        var dueDateStr = dueDate.HasValue ? dueDate.Value.ToString("MMM dd, yyyy hh:mm tt") : "Not specified";
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }}
        .header {{ background-color: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
        .urgent {{ color: #DC2626; font-weight: bold; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>⏰ Activity Reminder</h1>
        </div>
        <div class=""content"">
            <p>Hi {userName},</p>
            <p class=""urgent"">This is a reminder about your upcoming activity:</p>
            <div style=""background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0;"">
                <h3 style=""margin: 0 0 10px 0;"">{activitySubject}</h3>
                <p style=""margin: 5px 0;""><strong>Due Date:</strong> {dueDateStr}</p>
            </div>
            <p>Please ensure this activity is completed on time.</p>
            <a href=""#/crm/activities?id={activityId}"" class=""button"">View Activity</a>
        </div>
    </div>
</body>
</html>";
    }
}
