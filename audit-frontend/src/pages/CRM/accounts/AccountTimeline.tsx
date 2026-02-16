import React from "react";
import { format } from "date-fns";
import {
  Clock,
  Coffee,
  Mail,
  FileText,
  Zap,
  AlertCircle,
  Phone,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimelineEvent {
  id: string;
  type: "activity" | "note" | "call" | "email" | "meeting" | "system";
  title: string;
  description?: string;
  timestamp: Date;
  actor?: string;
  status?: "pending" | "completed" | "overdue";
}

interface AccountTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case "call":
      return <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    case "email":
      return <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
    case "meeting":
      return <Coffee className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    case "note":
      return <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />;
    case "system":
      return <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    default:
      return <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />;
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300";
    case "overdue":
      return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300";
    case "pending":
      return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300";
  }
};

export const AccountTimeline: React.FC<AccountTimelineProps> = ({
  events,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground dark:text-slate-400">
              Loading timeline...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="dark:text-slate-100">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground dark:text-slate-600 mb-2" />
            <p className="text-muted-foreground dark:text-slate-400">
              No events in timeline
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="dark:text-slate-100">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center">
                <div className="p-2 rounded-full bg-white dark:bg-slate-800 border-2 border-muted dark:border-slate-700">
                  {getEventIcon(event.type)}
                </div>
                {index < events.length - 1 && (
                  <div className="w-0.5 h-12 bg-muted dark:bg-slate-700 mt-2" />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 pt-1 pb-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium dark:text-slate-100">
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                  {event.status && (
                    <Badge className={`text-xs whitespace-nowrap ${getStatusColor(event.status)}`}>
                      {event.status}
                    </Badge>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground dark:text-slate-400">
                  <span>
                    {format(event.timestamp, "MMM dd, yyyy HH:mm")}
                  </span>
                  {event.actor && <span>•</span>}
                  {event.actor && <span>{event.actor}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountTimeline;
