import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Users,
  Building2,
  TrendingUp,
  Calendar,
  Clock,
  Plus,
  Settings,
  User,
  Bell,
  Filter,
  ArrowRight,
  Command,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  type: 'navigation' | 'action' | 'search' | 'recent';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  badge?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<CommandItem[]>([]);

  // Command items
  const commands = useMemo<CommandItem[]>(
    () => [
      // Quick Actions
      {
        id: 'create-lead',
        type: 'action',
        title: 'Create New Lead',
        subtitle: 'Add a new lead to the system',
        icon: <Plus className="w-4 h-4" />,
        action: () => navigate('/crm/leads/new'),
        keywords: ['new', 'add', 'create', 'lead'],
        badge: 'Create',
      },
      {
        id: 'create-contact',
        type: 'action',
        title: 'Create New Contact',
        subtitle: 'Add a new contact',
        icon: <Plus className="w-4 h-4" />,
        action: () => navigate('/crm/contacts/new'),
        keywords: ['new', 'add', 'create', 'contact'],
        badge: 'Create',
      },
      {
        id: 'create-account',
        type: 'action',
        title: 'Create New Account',
        subtitle: 'Add a new company account',
        icon: <Plus className="w-4 h-4" />,
        action: () => navigate('/crm/accounts/new'),
        keywords: ['new', 'add', 'create', 'account', 'company'],
        badge: 'Create',
      },
      {
        id: 'create-opportunity',
        type: 'action',
        title: 'Create New Opportunity',
        subtitle: 'Add a new sales opportunity',
        icon: <Plus className="w-4 h-4" />,
        action: () => navigate('/crm/opportunities/new'),
        keywords: ['new', 'add', 'create', 'opportunity', 'deal'],
        badge: 'Create',
      },

      // Navigation
      {
        id: 'nav-dashboard',
        type: 'navigation',
        title: 'Dashboard',
        subtitle: 'View CRM dashboard and analytics',
        icon: <TrendingUp className="w-4 h-4" />,
        action: () => navigate('/crm/dashboard'),
        keywords: ['dashboard', 'home', 'analytics', 'metrics'],
      },
      {
        id: 'nav-leads',
        type: 'navigation',
        title: 'Leads',
        subtitle: 'View all leads',
        icon: <Users className="w-4 h-4" />,
        action: () => navigate('/crm/leads'),
        keywords: ['leads', 'prospects'],
      },
      {
        id: 'nav-contacts',
        type: 'navigation',
        title: 'Contacts',
        subtitle: 'View all contacts',
        icon: <User className="w-4 h-4" />,
        action: () => navigate('/crm/contacts'),
        keywords: ['contacts', 'people'],
      },
      {
        id: 'nav-accounts',
        type: 'navigation',
        title: 'Accounts',
        subtitle: 'View all accounts',
        icon: <Building2 className="w-4 h-4" />,
        action: () => navigate('/crm/accounts'),
        keywords: ['accounts', 'companies', 'organizations'],
      },
      {
        id: 'nav-opportunities',
        type: 'navigation',
        title: 'Opportunities',
        subtitle: 'View all opportunities',
        icon: <TrendingUp className="w-4 h-4" />,
        action: () => navigate('/crm/opportunities'),
        keywords: ['opportunities', 'deals', 'sales'],
      },
      {
        id: 'nav-activities',
        type: 'navigation',
        title: 'Activities',
        subtitle: 'View all activities and tasks',
        icon: <Calendar className="w-4 h-4" />,
        action: () => navigate('/crm/activities'),
        keywords: ['activities', 'tasks', 'calendar'],
      },
      {
        id: 'nav-meetings',
        type: 'navigation',
        title: 'Meetings',
        subtitle: 'View scheduled meetings',
        icon: <Clock className="w-4 h-4" />,
        action: () => navigate('/crm/meetings'),
        keywords: ['meetings', 'calendar', 'appointments'],
      },

      // Other Actions
      {
        id: 'notifications',
        type: 'action',
        title: 'Notifications',
        subtitle: 'View all notifications',
        icon: <Bell className="w-4 h-4" />,
        action: () => navigate('/notifications'),
        keywords: ['notifications', 'alerts', 'updates'],
      },
      {
        id: 'saved-views',
        type: 'action',
        title: 'Saved Views',
        subtitle: 'Manage your saved filters',
        icon: <Filter className="w-4 h-4" />,
        action: () => navigate('/crm/saved-views'),
        keywords: ['views', 'filters', 'saved'],
      },
      {
        id: 'settings',
        type: 'action',
        title: 'Settings',
        subtitle: 'Configure your preferences',
        icon: <Settings className="w-4 h-4" />,
        action: () => navigate('/settings'),
        keywords: ['settings', 'preferences', 'config'],
      },
    ],
    [navigate]
  );

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show recent items if no query
      return recentItems.length > 0 ? recentItems : commands.slice(0, 8);
    }

    const lowerQuery = query.toLowerCase();
    return commands.filter((cmd) => {
      const searchText = `${cmd.title} ${cmd.subtitle} ${cmd.keywords?.join(' ')}`.toLowerCase();
      return searchText.includes(lowerQuery);
    });
  }, [query, commands, recentItems]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredCommands, selectedIndex, onOpenChange]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  const executeCommand = useCallback(
    (command: CommandItem) => {
      command.action();
      onOpenChange(false);

      // Add to recent items
      setRecentItems((prev) => {
        const filtered = prev.filter((item) => item.id !== command.id);
        return [command, ...filtered].slice(0, 5);
      });
    },
    [onOpenChange]
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'action':
        return <Command className="w-3 h-3" />;
      case 'navigation':
        return <ArrowRight className="w-3 h-3" />;
      case 'search':
        return <Search className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">ESC</span>
          </kbd>
        </div>

        {/* Command List */}
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              <>
                {!query && recentItems.length > 0 && (
                  <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                    Recent
                  </div>
                )}
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => executeCommand(command)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors',
                      'hover:bg-accent',
                      selectedIndex === index && 'bg-accent'
                    )}
                  >
                    <div className="flex-shrink-0 text-muted-foreground">
                      {command.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {command.title}
                        </span>
                        {command.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {command.badge}
                          </Badge>
                        )}
                      </div>
                      {command.subtitle && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {command.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-muted-foreground">
                      {getTypeIcon(command.type)}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground bg-muted/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono font-medium opacity-100 flex">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono font-medium opacity-100 flex">
                ↵
              </kbd>
              Select
            </span>
          </div>
          <span>Press Cmd+K or Ctrl+K to open</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to use command palette
export const useCommandPalette = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
};
