import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Filter,
  Star,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface SavedView {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  filterJson: string;
  isShared: boolean;
  isDefault: boolean;
  usageCount: number;
  createdByName: string;
  iconName?: string;
  colorHex?: string;
}

interface SavedViewsManagerProps {
  entityType: string;
  currentFilters?: any;
  onApplyView: (filters: any) => void;
  className?: string;
}

export const SavedViewsManager: React.FC<SavedViewsManagerProps> = ({
  entityType,
  currentFilters,
  onApplyView,
  className,
}) => {
  const [views, setViews] = useState<SavedView[]>([
    {
      id: '1',
      name: 'My Active Leads',
      description: 'All my active leads that need follow-up',
      entityType: 'Lead',
      filterJson: JSON.stringify({ status: 'Active', assignedTo: 'me' }),
      isShared: false,
      isDefault: true,
      usageCount: 45,
      createdByName: 'Me',
      iconName: 'star',
      colorHex: '#3b82f6',
    },
    {
      id: '2',
      name: 'Hot Leads',
      description: 'High-priority leads with score > 80',
      entityType: 'Lead',
      filterJson: JSON.stringify({ score: { min: 80 }, status: 'Active' }),
      isShared: true,
      isDefault: false,
      usageCount: 23,
      createdByName: 'John Smith',
      iconName: 'flame',
      colorHex: '#ef4444',
    },
    {
      id: '3',
      name: 'Overdue Follow-ups',
      description: 'Leads with overdue activities',
      entityType: 'Lead',
      filterJson: JSON.stringify({ hasOverdueActivities: true }),
      isShared: true,
      isDefault: false,
      usageCount: 12,
      createdByName: 'Sarah Johnson',
      iconName: 'clock',
      colorHex: '#f59e0b',
    },
  ]);

  const [selectedView, setSelectedView] = useState<SavedView | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingView, setEditingView] = useState<SavedView | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isShared: false,
    isDefault: false,
  });

  const handleApplyView = (view: SavedView) => {
    setSelectedView(view);
    const filters = JSON.parse(view.filterJson);
    onApplyView(filters);

    // Track usage
    setViews((prev) =>
      prev.map((v) =>
        v.id === view.id ? { ...v, usageCount: v.usageCount + 1 } : v
      )
    );
  };

  const handleSaveCurrentView = () => {
    if (!formData.name.trim()) return;

    const newView: SavedView = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      entityType,
      filterJson: JSON.stringify(currentFilters || {}),
      isShared: formData.isShared,
      isDefault: formData.isDefault,
      usageCount: 0,
      createdByName: 'Me',
    };

    setViews((prev) => [...prev, newView]);
    setShowSaveDialog(false);
    setFormData({ name: '', description: '', isShared: false, isDefault: false });
  };

  const handleUpdateView = () => {
    if (!editingView || !formData.name.trim()) return;

    setViews((prev) =>
      prev.map((v) =>
        v.id === editingView.id
          ? {
              ...v,
              name: formData.name,
              description: formData.description,
              isShared: formData.isShared,
              isDefault: formData.isDefault,
            }
          : v
      )
    );

    setShowEditDialog(false);
    setEditingView(null);
    setFormData({ name: '', description: '', isShared: false, isDefault: false });
  };

  const handleDeleteView = (viewId: string) => {
    setViews((prev) => prev.filter((v) => v.id !== viewId));
    if (selectedView?.id === viewId) {
      setSelectedView(null);
    }
  };

  const handleDuplicateView = (view: SavedView) => {
    const duplicated: SavedView = {
      ...view,
      id: Date.now().toString(),
      name: `${view.name} (Copy)`,
      usageCount: 0,
      isDefault: false,
      createdByName: 'Me',
    };
    setViews((prev) => [...prev, duplicated]);
  };

  const openEditDialog = (view: SavedView) => {
    setEditingView(view);
    setFormData({
      name: view.name,
      description: view.description || '',
      isShared: view.isShared,
      isDefault: view.isDefault,
    });
    setShowEditDialog(true);
  };

  return (
    <>
      {/* Saved Views Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={cn('gap-2', className)}>
            <Filter className="w-4 h-4" />
            {selectedView ? selectedView.name : 'Saved Views'}
            {selectedView && selectedView.isDefault && (
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px]">
          <div className="px-2 py-1.5 text-sm font-semibold">My Views</div>
          {views
            .filter((v) => v.createdByName === 'Me')
            .map((view) => (
              <ViewMenuItem
                key={view.id}
                view={view}
                isSelected={selectedView?.id === view.id}
                onSelect={() => handleApplyView(view)}
                onEdit={() => openEditDialog(view)}
                onDelete={() => handleDeleteView(view.id)}
                onDuplicate={() => handleDuplicateView(view)}
              />
            ))}

          {views.filter((v) => v.createdByName !== 'Me' && v.isShared).length >
            0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm font-semibold">
                Shared Views
              </div>
              {views
                .filter((v) => v.createdByName !== 'Me' && v.isShared)
                .map((view) => (
                  <ViewMenuItem
                    key={view.id}
                    view={view}
                    isSelected={selectedView?.id === view.id}
                    onSelect={() => handleApplyView(view)}
                    onEdit={undefined} // Can't edit shared views
                    onDelete={undefined}
                    onDuplicate={() => handleDuplicateView(view)}
                  />
                ))}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Save Current View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save View Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>
              Save your current filters as a reusable view
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">View Name*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., High Priority Leads"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="shared">Share with team</Label>
              <Switch
                id="shared"
                checked={formData.isShared}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isShared: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="default">Set as default view</Label>
              <Switch
                id="default"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isDefault: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCurrentView}>Save View</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit View Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit View</DialogTitle>
            <DialogDescription>Update view settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">View Name*</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-shared">Share with team</Label>
              <Switch
                id="edit-shared"
                checked={formData.isShared}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isShared: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-default">Set as default view</Label>
              <Switch
                id="edit-default"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isDefault: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateView}>Update View</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// View Menu Item Component
interface ViewMenuItemProps {
  view: SavedView;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate: () => void;
}

const ViewMenuItem: React.FC<ViewMenuItemProps> = ({
  view,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  return (
    <div className="flex items-center group">
      <button
        onClick={onSelect}
        className={cn(
          'flex-1 flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left',
          isSelected && 'bg-accent'
        )}
      >
        {isSelected && <Check className="w-4 h-4 text-primary" />}
        {!isSelected && <div className="w-4" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{view.name}</span>
            {view.isDefault && (
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
            )}
            {view.isShared && (
              <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          {view.description && (
            <p className="text-xs text-muted-foreground truncate">
              {view.description}
            </p>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {view.usageCount}
        </Badge>
      </button>
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
          {onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
