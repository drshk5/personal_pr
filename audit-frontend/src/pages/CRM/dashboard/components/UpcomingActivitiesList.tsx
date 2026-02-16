import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UpcomingActivity } from "@/types/crm/dashboard.types";
import { Calendar, Phone, Mail, MessageSquare, CheckSquare, Clock } from "lucide-react";
import { format } from "date-fns";

interface UpcomingActivitiesListProps {
  data: UpcomingActivity[];
}

const getActivityIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "call":
      return <Phone className="h-4 w-4" />;
    case "email":
      return <Mail className="h-4 w-4" />;
    case "meeting":
      return <Calendar className="h-4 w-4" />;
    case "task":
      return <CheckSquare className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "call":
      return "text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30";
    case "email":
      return "text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30";
    case "meeting":
      return "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30";
    case "task":
      return "text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30";
    default:
      return "text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/50";
  }
};

export function UpcomingActivitiesList({ data }: UpcomingActivitiesListProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No upcoming activities
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((activity) => (
            <div
              key={activity.strActivityGUID}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className={`p-2 rounded-lg ${getActivityColor(activity.strActivityType)}`}>
                {getActivityIcon(activity.strActivityType)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm leading-none">
                  {activity.strSubject}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {activity.strActivityType}
                  </Badge>
                  {activity.dtScheduledOn && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(activity.dtScheduledOn), "MMM dd, h:mm a")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
