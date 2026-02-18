import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  UserPlus,
  TrendingUp,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  actionUrl?: string;
  actionText?: string;
  actorUserId?: string;
  actorUserName?: string;
  isRead: boolean;
  readOn?: Date;
  createdOn: Date;
  timeAgo: string;
}

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/crm/notifications/summary');
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Lead Assigned',
          message: 'John Smith assigned you a new lead: Acme Corp',
          type: 'info',
          category: 'LeadAssignment',
          entityType: 'Lead',
          entityId: 'lead-123',
          entityName: 'Acme Corp',
          actionUrl: '/crm/leads/lead-123',
          actionText: 'View Lead',
          actorUserId: 'user-1',
          actorUserName: 'John Smith',
          isRead: false,
          createdOn: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
          timeAgo: '30 minutes ago',
        },
        {
          id: '2',
          title: 'Lead Converted',
          message: 'Lead "Tech Solutions" was successfully converted',
          type: 'success',
          category: 'LeadStatusChange',
          entityType: 'Lead',
          entityId: 'lead-456',
          entityName: 'Tech Solutions',
          isRead: false,
          createdOn: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          timeAgo: '2 hours ago',
        },
        {
          id: '3',
          title: 'Meeting Reminder',
          message: 'Meeting with Global Industries starts in 15 minutes',
          type: 'warning',
          category: 'MeetingReminder',
          entityType: 'Meeting',
          entityId: 'meeting-789',
          isRead: true,
          createdOn: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
          timeAgo: '5 hours ago',
        },
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: API call to mark as read
      // await fetch(`/api/crm/notifications/mark-read`, {
      //   method: 'POST',
      //   body: JSON.stringify({ notificationIds: [notificationId], isRead: true })
      // });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readOn: new Date() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: API call to mark all as read
      // await fetch(`/api/crm/notifications/mark-all-read`, { method: 'POST' });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readOn: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // TODO: API call to delete
      // await fetch(`/api/crm/notifications/${notificationId}`, { method: 'DELETE' });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => {
        const notification = notifications.find((n) => n.id === notificationId);
        return notification && !notification.isRead ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'LeadAssignment':
        return <UserPlus className="w-4 h-4" />;
      case 'MeetingReminder':
        return <Calendar className="w-4 h-4" />;
      case 'LeadStatusChange':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    return true;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} new</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="m-0 mt-2">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-muted-foreground">Loading...</div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    No notifications yet
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      getTypeIcon={getTypeIcon}
                      getCategoryIcon={getCategoryIcon}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="m-0 mt-2">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      getTypeIcon={getTypeIcon}
                      getCategoryIcon={getCategoryIcon}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/50">
          <Button variant="ghost" className="w-full justify-center text-sm">
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Notification Item Component
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getTypeIcon: (type: string) => React.ReactNode;
  getCategoryIcon: (category: string) => React.ReactNode;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  getTypeIcon,
  getCategoryIcon,
}) => {
  return (
    <div
      className={cn(
        'p-4 hover:bg-accent transition-colors cursor-pointer group',
        !notification.isRead && 'bg-blue-50/50 dark:bg-blue-950/20'
      )}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {getCategoryIcon(notification.category)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">{notification.title}</h4>
              {!notification.isRead && (
                <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              )}
            </div>
            {getTypeIcon(notification.type)}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {notification.message}
          </p>
          {notification.entityName && (
            <Badge variant="outline" className="text-xs mb-2">
              {notification.entityType}: {notification.entityName}
            </Badge>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {notification.timeAgo}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
