import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Calendar as CalendarIcon,
  MapPin,
  Video,
  Users,
  Plus,
  X,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingLink?: string;
  attendees: Array<{ id: string; name: string; email: string }>;
  status: string;
}

interface MeetingSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  onSave?: (meeting: Meeting) => void;
}

export const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
  open,
  onOpenChange,
  entityName,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    meetingLink: '',
    isVirtualMeeting: false,
    reminders: ['15'], // Minutes before
  });

  const [attendees, setAttendees] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');

  const handleAddAttendee = () => {
    if (!newAttendeeEmail.trim()) return;

    const attendee = {
      id: Date.now().toString(),
      name: newAttendeeEmail.split('@')[0],
      email: newAttendeeEmail,
    };

    setAttendees((prev) => [...prev, attendee]);
    setNewAttendeeEmail('');
  };

  const handleRemoveAttendee = (attendeeId: string) => {
    setAttendees((prev) => prev.filter((a) => a.id !== attendeeId));
  };

  const handleSave = () => {
    const [startHour, startMinute] = formData.startTime.split(':').map(Number);
    const [endHour, endMinute] = formData.endTime.split(':').map(Number);

    const startDateTime = new Date(formData.date);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(formData.date);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    const meeting: Meeting = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      startTime: startDateTime,
      endTime: endDateTime,
      location: formData.location,
      meetingLink: formData.meetingLink,
      attendees,
      status: 'Scheduled',
    };

    onSave?.(meeting);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date(),
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      meetingLink: '',
      isVirtualMeeting: false,
      reminders: ['15'],
    });
    setAttendees([]);
  };

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            {entityName ? `Create a meeting for ${entityName}` : 'Create a new meeting'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Meeting Title*</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Product Demo"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Meeting agenda and notes..."
                rows={3}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-1">
                <Label>Date*</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) =>
                        date && setFormData((prev) => ({ ...prev, date }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="start-time">Start Time*</Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, startTime: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="end-time">End Time*</Label>
                <Select
                  value={formData.endTime}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, endTime: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location / Virtual Meeting */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="virtual">Virtual Meeting</Label>
                <Switch
                  id="virtual"
                  checked={formData.isVirtualMeeting}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isVirtualMeeting: checked }))
                  }
                />
              </div>

              {formData.isVirtualMeeting ? (
                <div>
                  <Label htmlFor="meeting-link">
                    <Video className="w-4 h-4 inline mr-2" />
                    Meeting Link
                  </Label>
                  <Input
                    id="meeting-link"
                    value={formData.meetingLink}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, meetingLink: e.target.value }))
                    }
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="location">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="Conference Room A, 123 Main St..."
                  />
                </div>
              )}
            </div>

            {/* Attendees */}
            <div>
              <Label>
                <Users className="w-4 h-4 inline mr-2" />
                Attendees
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newAttendeeEmail}
                  onChange={(e) => setNewAttendeeEmail(e.target.value)}
                  placeholder="Enter email address"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAttendee();
                    }
                  }}
                />
                <Button onClick={handleAddAttendee} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {attendees.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {attendees.map((attendee) => (
                    <Badge key={attendee.id} variant="secondary" className="gap-2">
                      {attendee.email}
                      <button
                        onClick={() => handleRemoveAttendee(attendee.id)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Reminders */}
            <div>
              <Label>
                <Bell className="w-4 h-4 inline mr-2" />
                Reminders
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['5', '15', '30', '60'].map((minutes) => (
                  <Badge
                    key={minutes}
                    variant={formData.reminders.includes(minutes) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        reminders: prev.reminders.includes(minutes)
                          ? prev.reminders.filter((m) => m !== minutes)
                          : [...prev.reminders, minutes],
                      }));
                    }}
                  >
                    {minutes} min before
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.title.trim()}>
            Schedule Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
