import React, { useEffect, useMemo, useState } from "react";
import { Mail, Send, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Checkbox } from "@/components/ui/checkbox";

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

const EMAIL_TEMPLATES: Record<string, { name: string; subject: string; body: string }> = {
  update: {
    name: "Activity Update",
    subject: "Activity Update",
    body: "Hello,\n\nPlease review the selected activity and update the status.\n\nThank you.",
  },
  reminder: {
    name: "Reminder",
    subject: "Activity Reminder",
    body: "Hello,\n\nThis is a reminder to complete the selected activity.\n\nThanks.",
  },
  followup: {
    name: "Follow-up",
    subject: "Activity Follow-up",
    body: "Hello,\n\nFollowing up on the selected activity. Please take the next action.\n\nRegards.",
  },
};

export const BulkEmailModal: React.FC<BulkEmailModalProps> = ({
  isOpen,
  onClose,
  selectedActivities,
  onSend,
}) => {
  const [template, setTemplate] = useState("update");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendToCreators, setSendToCreators] = useState(false);
  const [additionalRecipients, setAdditionalRecipients] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const selected = EMAIL_TEMPLATES.update;
    setTemplate("update");
    setSubject(selected.subject);
    setBody(selected.body);
    setSendToCreators(false);
    setAdditionalRecipients("");
  }, [isOpen]);

  const recipientCountHint = useMemo(
    () => `${selectedActivities.length} ${selectedActivities.length === 1 ? "activity" : "activities"} selected`,
    [selectedActivities]
  );

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    const preset = EMAIL_TEMPLATES[value];
    if (!preset) return;
    setSubject(preset.subject);
    setBody(preset.body);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;

    const recipients = additionalRecipients
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    setIsSending(true);
    try {
      await onSend({
        activityGuids: selectedActivities,
        subject: subject.trim(),
        body: body.trim(),
        // Auto-on for activity assignment recipients
        sendToAssignedUsers: true,
        sendToCreators,
        additionalRecipients: recipients,
      });
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl border-border/70 bg-card/95 text-foreground shadow-2xl backdrop-blur">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="inline-flex items-center justify-center rounded-md bg-primary/15 p-1.5 text-primary">
              <Mail className="h-4 w-4" />
            </span>
            Send Bulk Email
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Activity
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {recipientCountHint}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Email Template</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger className="border-border/70 bg-background/70">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMAIL_TEMPLATES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Recipients</Label>
            <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground">
              Assigned users will be included automatically.
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={sendToCreators}
                onCheckedChange={(checked) => setSendToCreators(Boolean(checked))}
                disabled={isSending}
              />
              Also include activity creators
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-bulk-subject" className="text-sm font-medium text-foreground">
              Subject
            </Label>
            <Input
              id="activity-bulk-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
              className="border-border/70 bg-background/70"
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-bulk-body" className="text-sm font-medium text-foreground">
              Message
            </Label>
            <textarea
              id="activity-bulk-body"
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter plain text message"
              className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="activity-bulk-additional-recipients"
              className="text-sm font-medium text-foreground"
            >
              Additional Recipients (comma-separated)
            </Label>
            <Input
              id="activity-bulk-additional-recipients"
              value={additionalRecipients}
              onChange={(e) => setAdditionalRecipients(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="border-border/70 bg-background/70"
              disabled={isSending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !body.trim()}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
