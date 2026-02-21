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
import { ScrollArea } from "@/components/ui/scroll-area";

const EMAIL_TEMPLATES: Record<string, { name: string; body: string }> = {
  simple: {
    name: "Simple",
    body: `Hello,\n\nThis is a quick update from our CRM team.\n\nRegards,\nCRM Team`,
  },
  followup: {
    name: "Follow-up",
    body: `Hello,\n\nJust following up on our previous communication.\nPlease let us know if you need anything else.\n\nRegards,\nCRM Team`,
  },
  reminder: {
    name: "Reminder",
    body: `Hello,\n\nThis is a friendly reminder regarding your pending item.\n\nThanks,\nCRM Team`,
  },
};

interface BulkRecipientEmailModalProps {
  open: boolean;
  onClose: () => void;
  recipients: string[];
  defaultSubject: string;
  defaultBody: string;
  onSend: (payload: { subject: string; body: string; isHtml: boolean }) => Promise<void>;
}

export const BulkRecipientEmailModal: React.FC<BulkRecipientEmailModalProps> = ({
  open,
  onClose,
  recipients,
  defaultSubject,
  defaultBody,
  onSend,
}) => {
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubject(defaultSubject);
    setBody(defaultBody);
    setSelectedTemplate("custom");
  }, [open, defaultSubject, defaultBody]);

  const uniqueRecipients = useMemo(
    () => Array.from(new Set(recipients.map((r) => r.trim()).filter(Boolean))),
    [recipients]
  );

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    if (value === "custom") return;
    const template = EMAIL_TEMPLATES[value];
    if (template) {
      setBody(template.body);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || uniqueRecipients.length === 0) return;
    setIsSending(true);
    try {
      await onSend({
        subject: subject.trim(),
        body: body.trim(),
        isHtml: false,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-3xl border-border/70 bg-card/95 text-foreground shadow-2xl backdrop-blur">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="inline-flex items-center justify-center rounded-md bg-primary/15 p-1.5 text-primary">
              <Mail className="h-4 w-4" />
            </span>
            Send Bulk Email
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Quick Send
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Selected recipients: {uniqueRecipients.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Recipients</Label>
            <ScrollArea className="h-24 rounded-lg border border-border/70 bg-background/70 p-2">
              <div className="flex flex-wrap gap-2 pr-2">
                {uniqueRecipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Email Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger className="border-border/70 bg-background/70">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                  <SelectItem key={key} value={key}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-email-subject" className="text-sm font-medium text-foreground">
              Subject
            </Label>
            <Input
              id="bulk-email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
              className="border-border/70 bg-background/70"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-email-body" className="text-sm font-medium text-foreground">
              Message
            </Label>
            <textarea
              id="bulk-email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Enter message"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              isSending || !subject.trim() || !body.trim() || uniqueRecipients.length === 0
            }
          >
            <Send className="mr-2 h-4 w-4" />
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
