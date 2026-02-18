import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Mail,
  Phone,
  Calendar,
  FileText,
  UserPlus,
  TrendingUp,
  Edit,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'status_change' | 'creation' | 'document' | 'task';
  title: string;
  description?: string;
  timestamp: Date;
  actorName: string;
  actorAvatar?: string;
  metadata?: Record<string, any>;
  attachments?: Array<{ name: string; url: string }>;
}

interface TimelineViewProps {
  entityType: string;
  entityId: string;
  events?: TimelineEvent[];
  className?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events: initialEvents,
  className,
}) => {
  const [events] = useState<TimelineEvent[]>(
    initialEvents || [
      {
        id: '1',
        type: 'creation',
        title: 'Lead Created',
        description: 'Lead was created and assigned to sales team',
        timestamp: new Date('2026-02-10'),
        actorName: 'John Smith',
        metadata: { source: 'Web Form' },
      },
      {
        id: '2',
        type: 'email',
        title: 'Email Sent',
        description: 'Sent introduction email with product information',
        timestamp: new Date('2026-02-11'),
        actorName: 'Sarah Johnson',
      },
      {
        id: '3',
        type: 'call',
        title: 'Phone Call',
        description: 'Initial discovery call - 25 minutes. Discussed requirements.',
        timestamp: new Date('2026-02-12'),
        actorName: 'John Smith',
        metadata: { duration: 25, outcome: 'Interested' },
      },
      {
        id: '4',
        type: 'meeting',
        title: 'Demo Meeting Scheduled',
        description: 'Product demo scheduled for Feb 20, 2026 at 2:00 PM',
        timestamp: new Date('2026-02-13'),
        actorName: 'Sarah Johnson',
      },
      {
        id: '5',
        type: 'note',
        title: 'Note Added',
        description: 'Customer is very interested in enterprise features. Budget approved.',
        timestamp: new Date('2026-02-14'),
        actorName: 'John Smith',
      },
      {
        id: '6',
        type: 'status_change',
        title: 'Status Changed',
        description: 'Status changed from "New" to "Qualified"',
        timestamp: new Date('2026-02-15'),
        actorName: 'John Smith',
        metadata: { from: 'New', to: 'Qualified' },
      },
      {
        id: '7',
        type: 'document',
        title: 'Document Uploaded',
        description: 'Product proposal document uploaded',
        timestamp: new Date('2026-02-16'),
        actorName: 'Sarah Johnson',
        attachments: [{ name: 'Proposal_V1.pdf', url: '#' }],
      },
    ]
  );

  const [filterType, setFilterType] = useState<string | null>(null);

  const getEventIcon = (type: string) => {
    const iconClass = 'w-4 h-4';
    switch (type) {
      case 'email':
        return <Mail className={iconClass} />;
      case 'call':
        return <Phone className={iconClass} />;
      case 'meeting':
        return <Calendar className={iconClass} />;
      case 'note':
        return <FileText className={iconClass} />;
      case 'status_change':
        return <TrendingUp className={iconClass} />;
      case 'creation':
        return <UserPlus className={iconClass} />;
      case 'document':
        return <FileText className={iconClass} />;
      case 'task':
        return <CheckCircle className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-500';
      case 'call':
        return 'bg-green-500';
      case 'meeting':
        return 'bg-purple-500';
      case 'note':
        return 'bg-yellow-500';
      case 'status_change':
        return 'bg-orange-500';
      case 'creation':
        return 'bg-gray-500';
      case 'document':
        return 'bg-indigo-500';
      case 'task':
        return 'bg-teal-500';
      default:
        return 'bg-gray-400';
    }
  };

  const filteredEvents = filterType
    ? events.filter((e) => e.type === filterType)
    : events;

  const groupEventsByDate = (events: TimelineEvent[]) => {
    const groups: Record<string, TimelineEvent[]> = {};
    events.forEach((event) => {
      const dateKey = format(event.timestamp, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    return groups;
  };

  const eventGroups = groupEventsByDate(filteredEvents);
  const sortedDates = Object.keys(eventGroups).sort((a, b) => b.localeCompare(a));

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <h3 className="text-lg font-semibold text-foreground">Activity Timeline</h3>
          <Badge variant="secondary">{events.length} events</Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {filterType ? filterType.replace('_', ' ') : 'All'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterType(null)}>
              All Activities
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('email')}>
              <Mail className="w-4 h-4 mr-2" />
              Emails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('call')}>
              <Phone className="w-4 h-4 mr-2" />
              Calls
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('meeting')}>
              <Calendar className="w-4 h-4 mr-2" />
              Meetings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('note')}>
              <FileText className="w-4 h-4 mr-2" />
              Notes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('document')}>
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="space-y-8">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="sticky top-0 z-10 bg-background pb-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                </div>
              </div>

              {/* Events for this date */}
              <div className="relative pl-6 space-y-6">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-border" />

                {eventGroups[dateKey]
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((event, index) => (
                    <TimelineEventItem
                      key={event.id}
                      event={event}
                      getEventIcon={getEventIcon}
                      getEventColor={getEventColor}
                      isLast={index === eventGroups[dateKey].length - 1}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No activities found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// Timeline Event Item Component
interface TimelineEventItemProps {
  event: TimelineEvent;
  getEventIcon: (type: string) => React.ReactNode;
  getEventColor: (type: string) => string;
  isLast: boolean;
}

const TimelineEventItem: React.FC<TimelineEventItemProps> = ({
  event,
  getEventIcon,
  getEventColor,
}) => {
  return (
    <div className="relative group">
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute -left-6 top-1 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-white',
          getEventColor(event.type)
        )}
      >
        {getEventIcon(event.type)}
      </div>

      {/* Event card */}
      <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground">{event.title}</h4>
              <Badge variant="outline" className="text-xs">
                {event.type.replace('_', ' ')}
              </Badge>
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {event.description}
              </p>
            )}

            {/* Metadata */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(event.metadata).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            )}

            {/* Attachments */}
            {event.attachments && event.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {event.attachments.map((attachment, idx) => (
                  <a
                    key={idx}
                    href={attachment.url}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    {attachment.name}
                  </a>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={event.actorAvatar} />
                  <AvatarFallback className="text-[10px]">
                    {event.actorName.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span>{event.actorName}</span>
              </div>
              <span>•</span>
              <span>{formatDistanceToNow(event.timestamp, { addSuffix: true })}</span>
              <span>•</span>
              <span>{format(event.timestamp, 'h:mm a')}</span>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
