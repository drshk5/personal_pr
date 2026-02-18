import React, { useState } from "react";
import { X, Mail, Send, Info, Loader2, FileText, Code } from "lucide-react";

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedActivities: string[];
  onSend: (emailData: {
    activityGuids: string[];
    subject: string;
    body: string;
    sendToAssignedUsers: boolean;
    sendToCreators: boolean;
    additionalRecipients: string[];
  }) => Promise<void>;
}

// Email template presets
const EMAIL_TEMPLATES = {
  simple: {
    name: "Simple Template",
    body: `<p>Hello,</p>
<p>This is a notification regarding activity: <strong>{ActivitySubject}</strong></p>
<p><strong>Type:</strong> {ActivityType}</p>
<p><strong>Due Date:</strong> {DueDate}</p>
<p><strong>Status:</strong> {Status}</p>
<p><strong>Priority:</strong> {Priority}</p>
<p>Please take appropriate action.</p>
<p>Best regards,<br/>CRM Team</p>`
  },
  detailed: {
    name: "Detailed Template",
    body: `<h2>Activity Update</h2>
<div class="highlight-box">
  <h3>{ActivitySubject}</h3>
  <p><strong>Type:</strong> {ActivityType}</p>
  <p><strong>Priority:</strong> {Priority}</p>
  <p><strong>Status:</strong> {Status}</p>
  <p><strong>Due Date:</strong> {DueDate}</p>
</div>
<h3>Description</h3>
<p>{Description}</p>
<p>Please review this activity and complete it before the due date.</p>
<a href="#" class="email-button">View Activity</a>
<p>If you have any questions, please contact your manager.</p>`
  },
  reminder: {
    name: "Reminder Template",
    body: `<h2>⏰ Activity Reminder</h2>
<p>This is a friendly reminder about your pending activity:</p>
<div class="highlight-box">
  <h3>{ActivitySubject}</h3>
  <p><strong>Due Date:</strong> {DueDate}</p>
  <p><strong>Priority:</strong> {Priority}</p>
  <p><strong>Current Status:</strong> {Status}</p>
</div>
<p>Please ensure this activity is completed on time.</p>
<a href="#" class="email-button">Complete Activity</a>`
  },
  followup: {
    name: "Follow-up Template",
    body: `<h2>Follow-up Required</h2>
<p>We need your attention on the following activity:</p>
<div class="highlight-box">
  <p><strong>Activity:</strong> {ActivitySubject}</p>
  <p><strong>Type:</strong> {ActivityType}</p>
  <p><strong>Status:</strong> {Status}</p>
</div>
<h3>Next Steps</h3>
<p>{Description}</p>
<a href="#" class="email-button">View Details</a>
<p>Thank you for your prompt attention to this matter.</p>`
  }
};

export const BulkEmailModal: React.FC<BulkEmailModalProps> = ({
  isOpen,
  onClose,
  selectedActivities,
  onSend,
}) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendToAssignedUsers, setSendToAssignedUsers] = useState(true);
  const [sendToCreators, setSendToCreators] = useState(false);
  const [additionalRecipients, setAdditionalRecipients] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showRawHtml, setShowRawHtml] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !body.trim()) {
      return;
    }

    setIsSending(true);
    try {
      const recipients = additionalRecipients
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);

      await onSend({
        activityGuids: selectedActivities,
        subject: subject.trim(),
        body: body.trim(),
        sendToAssignedUsers,
        sendToCreators,
        additionalRecipients: recipients,
      });

      // Reset form
      setSubject("");
      setBody("");
      setSendToAssignedUsers(true);
      setSendToCreators(false);
      setAdditionalRecipients("");
      setSelectedTemplate("");
      setShowRawHtml(false);
      onClose();
    } catch (error) {
      console.error("Failed to send bulk emails:", error);
    } finally {
      setIsSending(false);
    }
  };

  const insertTemplate = (variable: string) => {
    setBody((prev) => prev + `{${variable}}`);
  };

  const applyTemplate = (templateKey: string) => {
    if (templateKey && EMAIL_TEMPLATES[templateKey as keyof typeof EMAIL_TEMPLATES]) {
      const template = EMAIL_TEMPLATES[templateKey as keyof typeof EMAIL_TEMPLATES];
      setBody(template.body);
      setSelectedTemplate(templateKey);
      if (!subject) {
        setSubject(`Activity Update: {ActivitySubject}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Send Bulk Email
              </h2>
              <p className="text-sm text-muted-foreground">
                Send custom emails to {selectedActivities.length}{" "}
                {selectedActivities.length === 1 ? "activity" : "activities"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={isSending}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Template Variables Info */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Available Template Variables:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "ActivitySubject",
                  "ActivityType",
                  "DueDate",
                  "Status",
                  "Priority",
                  "Description",
                ].map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertTemplate(variable)}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-mono hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    disabled={isSending}
                  >
                    {`{${variable}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Email Template Presets */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 inline mr-2" />
                Email Templates
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyTemplate(key)}
                    className={`px-3 py-2 text-sm border rounded-lg transition-colors text-left ${
                      selectedTemplate === key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input hover:border-primary hover:bg-muted"
                    }`}
                    disabled={isSending}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Recipients */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Recipients
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sendToAssignedUsers}
                    onChange={(e) => setSendToAssignedUsers(e.target.checked)}
                    className="w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-primary"
                    disabled={isSending}
                  />
                  <span className="text-sm text-foreground">
                    Send to assigned users
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sendToCreators}
                    onChange={(e) => setSendToCreators(e.target.checked)}
                    className="w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-primary"
                    disabled={isSending}
                  />
                  <span className="text-sm text-foreground">
                    Send to activity creators
                  </span>
                </label>
              </div>
            </div>

            {/* Additional recipients */}
            <div className="space-y-2">
              <label
                htmlFor="additional-recipients"
                className="block text-sm font-medium text-foreground"
              >
                Additional Recipients (comma-separated)
              </label>
              <input
                id="additional-recipients"
                type="text"
                value={additionalRecipients}
                onChange={(e) => setAdditionalRecipients(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSending}
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-foreground"
              >
                Subject <span className="text-destructive">*</span>
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSending}
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="body"
                  className="block text-sm font-medium text-foreground"
                >
                  Message <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowRawHtml(!showRawHtml)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
                  disabled={isSending}
                >
                  <Code className="h-3 w-3" />
                  {showRawHtml ? "Visual" : "HTML"} View
                </button>
              </div>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={showRawHtml ? "Enter HTML content..." : "Enter email message (HTML supported)..."}
                required
                rows={14}
                className={`w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                  showRawHtml ? "font-mono text-xs" : "text-sm"
                }`}
                disabled={isSending}
              />
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <p>
                  HTML formatting is automatically applied. Use template variables above or write custom HTML.
                  Your content will be wrapped in a professional email template with logo and styling.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Emails will be queued and sent in the background
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-background border border-input text-foreground rounded-lg hover:bg-muted transition-colors"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSending || !subject.trim() || !body.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
