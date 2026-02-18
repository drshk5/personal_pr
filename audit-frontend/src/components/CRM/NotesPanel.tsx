import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Send,
  Pin,
  Edit2,
  Trash2,
  MoreVertical,
  Lock,
  AtSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Note {
  id: string;
  content: string;
  isPrivate: boolean;
  isPinned: boolean;
  mentionedUsers: Array<{ id: string; name: string }>;
  createdByName: string;
  createdByAvatar?: string;
  createdOn: Date;
  updatedOn?: Date;
}

interface NotesPanelProps {
  entityType: string;
  entityId: string;
  notes?: Note[];
  className?: string;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  notes: initialNotes,
  className,
}) => {
  const [notes, setNotes] = useState<Note[]>(
    initialNotes || [
      {
        id: '1',
        content: 'Had a great conversation with the client. They are very interested in our enterprise solution. Budget has been approved for Q1.',
        isPrivate: false,
        isPinned: true,
        mentionedUsers: [{ id: 'user-2', name: 'Sarah Johnson' }],
        createdByName: 'John Smith',
        createdOn: new Date('2026-02-15'),
      },
      {
        id: '2',
        content: 'Follow up needed on pricing discussion. @Sarah Johnson can you prepare the quote?',
        isPrivate: false,
        isPinned: false,
        mentionedUsers: [{ id: 'user-2', name: 'Sarah Johnson' }],
        createdByName: 'John Smith',
        createdOn: new Date('2026-02-16'),
      },
      {
        id: '3',
        content: 'Internal note: Client mentioned competitor pricing. Need to review our position.',
        isPrivate: true,
        isPinned: false,
        mentionedUsers: [],
        createdByName: 'John Smith',
        createdOn: new Date('2026-02-17'),
      },
    ]
  );

  const [newNote, setNewNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      isPrivate,
      isPinned: false,
      mentionedUsers: extractMentions(newNote),
      createdByName: 'Me',
      createdOn: new Date(),
    };

    setNotes((prev) => [note, ...prev]);
    setNewNote('');
    setIsPrivate(false);
  };

  const extractMentions = (text: string): Array<{ id: string; name: string }> => {
    const mentionRegex = /@([A-Za-z\s]+)/g;
    const matches = text.matchAll(mentionRegex);
    const mentions: Array<{ id: string; name: string }> = [];
    
    for (const match of matches) {
      mentions.push({
        id: `user-${Math.random()}`,
        name: match[1].trim(),
      });
    }
    
    return mentions;
  };

  const handleTogglePin = (noteId: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
      )
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdOn.getTime() - a.createdOn.getTime();
  });

  const highlightMentions = (text: string) => {
    const parts = text.split(/(@[A-Za-z\s]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Notes</h3>
        <Badge variant="secondary">{notes.length}</Badge>
      </div>

      {/* New Note Input */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note... Use @ to mention team members"
            rows={3}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAddNote();
              }
            }}
          />
          {newNote.includes('@') && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="text-xs">
                <AtSign className="w-3 h-3 mr-1" />
                Mentions detected
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private" className="text-sm cursor-pointer">
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Private note
                </div>
              </Label>
            </div>
          </div>
          <Button onClick={handleAddNote} size="sm" disabled={!newNote.trim()}>
            <Send className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {sortedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notes yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first note to track important information
              </p>
            </div>
          ) : (
            sortedNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onTogglePin={handleTogglePin}
                onDelete={handleDeleteNote}
                highlightMentions={highlightMentions}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Note Item Component
interface NoteItemProps {
  note: Note;
  onTogglePin: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  highlightMentions: (text: string) => React.ReactNode;
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  onTogglePin,
  onDelete,
  highlightMentions,
}) => {
  return (
    <div
      className={cn(
        'bg-card border rounded-lg p-4 group hover:shadow-sm transition-shadow',
        note.isPinned && 'border-primary/50 bg-primary/5'
      )}
    >
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={note.createdByAvatar} />
          <AvatarFallback className="text-xs">
            {note.createdByName.split(' ').map((n) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{note.createdByName}</span>
              {note.isPrivate && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Private
                </Badge>
              )}
              {note.isPinned && (
                <Pin className="w-3 h-3 text-primary fill-primary" />
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTogglePin(note.id)}>
                  <Pin className="w-4 h-4 mr-2" />
                  {note.isPinned ? 'Unpin' : 'Pin'} Note
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Note
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(note.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm whitespace-pre-wrap mb-2">
            {highlightMentions(note.content)}
          </p>

          {note.mentionedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {note.mentionedUsers.map((user) => (
                <Badge key={user.id} variant="outline" className="text-xs">
                  <AtSign className="w-3 h-3 mr-1" />
                  {user.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(note.createdOn, { addSuffix: true })}</span>
            {note.updatedOn && (
              <>
                <span>•</span>
                <span>Edited</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
