# Bulk Email System Documentation

## Overview

The CRM system includes a high-performance bulk email system with automatic HTML formatting, professional templates, and logo support. All emails are sent asynchronously in the background with proper tenant isolation.

## Features

### ✨ Core Features

1. **Automatic HTML Wrapping**: All email content is automatically wrapped in a professional HTML template with gradient headers, responsive design, and consistent branding
2. **Logo Support**: Configure your company logo URL to appear in all emails
3. **Template Variables**: Dynamic content replacement for activity-specific information
4. **Email Templates**: Pre-built templates for common scenarios (Simple, Detailed, Reminder, Follow-up)
5. **Batch Processing**: High-performance queue-based email sending with configurable concurrency
6. **Tenant Isolation**: Complete data isolation ensuring emails only go to users within the same tenant
7. **Dark Theme Compatible**: All UI components support dark mode without errors

### 📧 Template Variables

Use these variables in your subject and body - they will be automatically replaced:

- `{ActivitySubject}` - Activity subject/title
- `{ActivityType}` - Type of activity (Email, Call, Meeting, etc.)
- `{DueDate}` - Formatted due date
- `{Status}` - Current status
- `{Priority}` - Priority level
- `{Description}` - Full activity description

### 🎨 HTML Email Structure

Every email is automatically styled with:

- **Professional Header**: Gradient background with logo and subject
- **Responsive Design**: Mobile-friendly layout (600px max width)
- **Branded Colors**: Purple gradient theme (#667eea to #764ba2)
- **Typography**: System font stack with proper line height
- **Buttons**: Pre-styled call-to-action buttons with hover effects
- **Highlight Boxes**: For important information with left border accent
- **Footer**: Professional footer with copyright and disclaimer

## Configuration

### Backend Configuration (`appsettings.json`)

```json
{
  "Email": {
    "Enabled": true,
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "SmtpUsername": "your-email@example.com",
    "SmtpPassword": "your-app-password",
    "FromEmail": "noreply@yourcompany.com",
    "FromName": "CRM System",
    "EnableSsl": "true",
    "LogoUrl": "https://yourcompany.com/logo.png",
    "BatchSize": 50,
    "DelayBetweenBatchesMs": 1000,
    "MaxConcurrentEmails": 10,
    "SmtpTimeoutSeconds": "30",
    "MaxSendAttempts": "3"
  }
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Enabled` | bool | false | Enable/disable email sending |
| `SmtpHost` | string | smtp.gmail.com | SMTP server hostname |
| `SmtpPort` | int | 587 | SMTP server port |
| `SmtpUsername` | string | - | SMTP authentication username |
| `SmtpPassword` | string | - | SMTP authentication password |
| `FromEmail` | string | - | Sender email address |
| `FromName` | string | CRM System | Sender display name |
| `EnableSsl` | bool | true | Use SSL/TLS encryption |
| `LogoUrl` | string | - | Company logo URL (optional) |
| `BatchSize` | int | 50 | Number of emails per batch |
| `DelayBetweenBatchesMs` | int | 1000 | Delay between batches (ms) |
| `MaxConcurrentEmails` | int | 10 | Max concurrent sends |

## Usage

### Frontend Usage

1. Navigate to Activities list
2. Select activities using checkboxes
3. Click "Send Email" in the bulk actions bar
4. Choose an email template or write custom content
5. Configure recipients:
   - Send to assigned users
   - Send to activity creators
   - Add custom email addresses
6. Use template variables in subject and body
7. Toggle between Visual and HTML view
8. Click "Send Email"

### API Usage

**Endpoint**: `POST /api/crm/activities/bulk-email`

**Request Body**:
```json
{
  "ActivityGuids": [
    "guid-1",
    "guid-2"
  ],
  "Subject": "Activity Update: {ActivitySubject}",
  "Body": "<p>Your activity <strong>{ActivitySubject}</strong> is due on {DueDate}</p>",
  "SendToAssignedUsers": true,
  "SendToCreators": false,
  "AdditionalRecipients": [
    "manager@example.com"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": 15,
  "message": "Successfully queued 15 emails for 5 activities"
}
```

## Email Templates

### 1. Simple Template
Basic notification with key activity details.

### 2. Detailed Template
Comprehensive update with description and action button.

### 3. Reminder Template
Urgent reminder with due date emphasis.

### 4. Follow-up Template
Professional follow-up request with next steps.

## HTML Customization

### Using Custom HTML

You can write custom HTML in the body field. The system automatically:

1. Detects if your content is already a complete HTML document
2. If not, wraps your content in the professional template
3. Applies template variable replacement
4. Adds logo and branding

### HTML Classes Available

When writing custom HTML, use these pre-styled classes:

- `.email-button` - Primary action button
- `.highlight-box` - Highlighted info box with left border
- `.divider` - Horizontal divider line

### Example Custom Email

```html
<h2>Custom Activity Update</h2>
<p>Hello,</p>
<div class="highlight-box">
  <h3>{ActivitySubject}</h3>
  <p><strong>Priority:</strong> {Priority}</p>
  <p><strong>Due:</strong> {DueDate}</p>
</div>
<p>{Description}</p>
<a href="#" class="email-button">Take Action</a>
<div class="divider"></div>
<p>Thank you for your attention.</p>
```

## Performance Optimization

### Queue-Based Processing

- Emails are queued immediately and processed in background
- No blocking of API requests
- Configurable batch size prevents SMTP throttling
- Delay between batches prevents rate limiting

### Concurrency Control

- `MaxConcurrentEmails` limits simultaneous sends
- Prevents overwhelming SMTP server
- Ensures reliable delivery

### Tenant Isolation

- All queries filtered by `strGroupGUID`
- User lookups from `MasterDbContext` with tenant filter
- Activity data from `CrmDbContext` with schema separation
- NO cross-tenant data leakage

## Gmail Configuration

For Gmail SMTP, use App Passwords:

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Generate an app password for "Mail"
4. Use the generated password in `SmtpPassword`

**Note**: Regular Gmail passwords won't work with SMTP.

## Troubleshooting

### Emails Not Sending

1. Check `Email:Enabled` is set to `true`
2. Verify SMTP credentials are correct
3. Check logs for SMTP errors
4. Ensure firewall allows SMTP port (587/465)
5. Verify sender email is authorized for SMTP

### Template Variables Not Replacing

1. Ensure curly braces are used: `{ActivitySubject}` not `%ActivitySubject%`
2. Check variable spelling matches exactly
3. Verify activities exist and have the field populated

### Performance Issues

1. Reduce `BatchSize` if emails are timing out
2. Increase `DelayBetweenBatchesMs` if hitting rate limits
3. Reduce `MaxConcurrentEmails` if SMTP server is slow
4. Monitor `Logs/` directory for performance metrics

## Security Considerations

1. **Never commit SMTP passwords** to version control
2. Use environment variables for sensitive config in production
3. Enable SSL/TLS for all SMTP connections
4. Implement rate limiting to prevent abuse
5. Log all bulk email operations for audit trail
6. Validate recipient email addresses
7. Implement email quotas per tenant if needed

## Architecture

```
Frontend (React)
    ↓
ActivityService.bulkEmail()
    ↓
API Controller: /api/crm/activities/bulk-email
    ↓
MstActivityApplicationService.SendBulkActivityEmailsAsync()
    ↓
EmailNotificationService
    ↓ (Queue)
Background Processing
    ↓ (Batches)
SMTP Server
    ↓
Recipients
```

## Monitoring

All bulk email operations are logged with:

- Timestamp
- User ID who initiated
- Number of activities
- Number of emails queued
- Tenant ID
- Success/failure status

Check logs at: `crm-backend/Logs/`

## Future Enhancements

- [ ] Email scheduling (send later)
- [ ] Email templates management UI
- [ ] Delivery tracking and open rates
- [ ] Bounce handling
- [ ] Unsubscribe management
- [ ] A/B testing for subject lines
- [ ] Rich text editor in frontend
- [ ] Email preview before sending
- [ ] Attachment support
- [ ] Save draft emails

## Support

For issues or questions about the bulk email system, check:

1. Application logs: `crm-backend/Logs/`
2. SMTP provider documentation
3. Network connectivity to SMTP server
4. Email configuration in `appsettings.json`
