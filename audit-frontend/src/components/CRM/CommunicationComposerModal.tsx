import { useEffect, useMemo, useState } from "react";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { communicationService } from "@/services/CRM/communication.service";
import { useCreateActivity } from "@/hooks/api/CRM/use-activities";
import type { ActivityType } from "@/types/CRM/activity";

type Channel = "email" | "call" | "message" | "whatsapp";

interface CommunicationComposerModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "Contact" | "Account";
  entityId: string;
  entityName: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  initialChannel?: Channel;
}

const EMAIL_TEMPLATES = {
  intro: {
    subject: "Introduction - {Name}",
    body: "Hello {Name},\n\nThank you for connecting with us.\n\nBest regards,\nCRM Team",
  },
  followup: {
    subject: "Follow-up - {Name}",
    body: "Hello {Name},\n\nFollowing up on our recent conversation.\n\nRegards,\nCRM Team",
  },
  reminder: {
    subject: "Reminder - {Name}",
    body: "Hi {Name},\n\nThis is a quick reminder regarding pending action.\n\nThanks,\nCRM Team",
  },
} as const;

const MESSAGE_TEMPLATES = {
  short: "Hi {Name}, quick update from CRM team.",
  followup: "Hi {Name}, just following up. Please confirm.",
  reminder: "Hi {Name}, friendly reminder about pending action.",
} as const;

const CALL_OUTCOMES = ["Connected", "No Answer", "Busy", "Voicemail", "Wrong Number"] as const;

const normalizePhoneForDial = (value: string) => value.replace(/[^+\d]/g, "").trim();
const normalizePhoneForWhatsApp = (value: string) => value.replace(/\D/g, "").trim();

const applyTemplateTokens = (value: string, name: string) => value.replace(/\{Name\}/g, name);

export function CommunicationComposerModal({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  recipientEmail,
  recipientPhone,
  initialChannel = "email",
}: CommunicationComposerModalProps) {
  const createActivity = useCreateActivity();
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [callOutcome, setCallOutcome] = useState<string>("Connected");
  const [callDurationMinutes, setCallDurationMinutes] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = (recipientEmail || "").trim();
  const phone = normalizePhoneForDial(recipientPhone || "");
  const whatsappPhone = normalizePhoneForWhatsApp(recipientPhone || "");

  useEffect(() => {
    if (!open) return;
    setChannel(initialChannel);
    setCallOutcome("Connected");
    setCallDurationMinutes(5);

    if (initialChannel === "email") {
      setSubject(applyTemplateTokens(EMAIL_TEMPLATES.intro.subject, entityName));
      setBody(applyTemplateTokens(EMAIL_TEMPLATES.intro.body, entityName));
    } else if (initialChannel === "message") {
      setSubject(`Message to ${entityName}`);
      setBody(applyTemplateTokens(MESSAGE_TEMPLATES.short, entityName));
    } else if (initialChannel === "whatsapp") {
      setSubject(`WhatsApp to ${entityName}`);
      setBody(applyTemplateTokens(MESSAGE_TEMPLATES.short, entityName));
    } else {
      setSubject(`Call with ${entityName}`);
      setBody("Call notes...");
    }
  }, [open, initialChannel, entityName]);

  const canSend = useMemo(() => {
    if (channel === "email") return !!email && !!subject.trim() && !!body.trim();
    if (channel === "message" || channel === "whatsapp") return !!body.trim();
    return !!subject.trim();
  }, [channel, email, subject, body]);

  const launchWithFallback = async (url: string, fallbackValue: string, fallbackLabel: string) => {
    let didHide = false;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") didHide = true;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange, { once: true });

    try {
      window.location.assign(url);
    } catch {
      // fallback below
    }

    window.setTimeout(async () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (didHide) return;
      try {
        await navigator.clipboard.writeText(fallbackValue);
        toast.error(`${fallbackLabel} app not available. Value copied to clipboard.`);
      } catch {
        toast.error(`${fallbackLabel} app not available on this system.`);
      }
    }, 900);
  };

  const logActivity = async (type: ActivityType, logSubject: string, logBody: string, extra?: {
    intDurationMinutes?: number;
    strOutcome?: string;
  }) => {
    await createActivity.mutateAsync({
      strActivityType: type,
      strSubject: logSubject,
      strDescription: logBody,
      intDurationMinutes: extra?.intDurationMinutes,
      strOutcome: extra?.strOutcome,
      strStatus: "Completed",
      strPriority: "Medium",
      strCategory: "Sales",
      links: [{ strEntityType: entityType, strEntityGUID: entityId }],
    });
  };

  const onApplyEmailTemplate = (key: keyof typeof EMAIL_TEMPLATES) => {
    setSubject(applyTemplateTokens(EMAIL_TEMPLATES[key].subject, entityName));
    setBody(applyTemplateTokens(EMAIL_TEMPLATES[key].body, entityName));
  };

  const onApplyMessageTemplate = (key: keyof typeof MESSAGE_TEMPLATES) => {
    setBody(applyTemplateTokens(MESSAGE_TEMPLATES[key], entityName));
  };

  const handleSubmit = async () => {
    if (!canSend) return;
    setIsSubmitting(true);
    try {
      if (channel === "email") {
        await communicationService.sendBulkEmail({
          recipients: [email],
          subject: subject.trim(),
          body: body.trim(),
          isHtml: false,
        });
        await logActivity("Email", subject.trim(), body.trim());
        toast.success("Email queued and activity logged");
      } else if (channel === "call") {
        if (phone) {
          await launchWithFallback(`tel:${phone}`, phone, "Call");
        }
        await logActivity(
          "Call",
          subject.trim(),
          body.trim(),
          { intDurationMinutes: callDurationMinutes, strOutcome: callOutcome }
        );
        toast.success("Call activity logged");
      } else if (channel === "message") {
        if (phone) {
          const smsBody = encodeURIComponent(body.trim());
          await launchWithFallback(`sms:${phone}?body=${smsBody}`, phone, "Message");
        }
        await logActivity("Note", subject.trim() || `Message to ${entityName}`, body.trim());
        toast.success("Message activity logged");
      } else {
        if (!whatsappPhone) {
          toast.error("Valid phone with country code is required for WhatsApp");
          return;
        }
        const messageText = encodeURIComponent(body.trim());
        const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${messageText}`;
        const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        if (!popup) {
          await launchWithFallback(whatsappUrl, whatsappPhone, "WhatsApp");
        }
        await logActivity("Note", subject.trim() || `WhatsApp to ${entityName}`, body.trim());
        toast.success("WhatsApp opened and activity logged");
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to process communication");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl border-border/70 bg-card/95 shadow-xl backdrop-blur">
        <DialogHeader>
          <DialogTitle>Communicate with {entityName}</DialogTitle>
          <DialogDescription>
            Send email, log call, or send message with templates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Channel</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button
                type="button"
                variant={channel === "email" ? "default" : "outline"}
                onClick={() => setChannel("email")}
                className="justify-start"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                type="button"
                variant={channel === "call" ? "default" : "outline"}
                onClick={() => setChannel("call")}
                className="justify-start"
              >
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button
                type="button"
                variant={channel === "message" ? "default" : "outline"}
                onClick={() => setChannel("message")}
                className="justify-start"
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
              <Button
                type="button"
                variant={channel === "whatsapp" ? "default" : "outline"}
                onClick={() => setChannel("whatsapp")}
                className="justify-start"
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input value={email || "Not available"} disabled />
            </div>
            <div className="space-y-2">
              <Label>Recipient Phone</Label>
              <Input value={phone || "Not available"} disabled />
            </div>
          </div>

          {channel === "email" && (
            <div className="space-y-2">
              <Label>Email Template</Label>
              <Select defaultValue="intro" onValueChange={(v) => onApplyEmailTemplate(v as keyof typeof EMAIL_TEMPLATES)}>
                <SelectTrigger className="border-border/70 bg-background/70">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intro">Intro</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(channel === "message" || channel === "whatsapp") && (
            <div className="space-y-2">
              <Label>{channel === "whatsapp" ? "WhatsApp Template" : "Message Template"}</Label>
              <Select defaultValue="short" onValueChange={(v) => onApplyMessageTemplate(v as keyof typeof MESSAGE_TEMPLATES)}>
                <SelectTrigger className="border-border/70 bg-background/70">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {channel === "call" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Call Outcome</Label>
                <Select value={callOutcome} onValueChange={setCallOutcome}>
                  <SelectTrigger className="border-border/70 bg-background/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALL_OUTCOMES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  max={240}
                  value={callDurationMinutes}
                  onChange={(e) => setCallDurationMinutes(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
            />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter message or notes"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSend || isSubmitting || createActivity.isPending}>
            {isSubmitting ? "Processing..." : "Send / Log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
