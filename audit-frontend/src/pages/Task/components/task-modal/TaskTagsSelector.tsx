import { useState, useEffect } from "react";
import { X, Check, Tag as TagIcon, Info } from "lucide-react";

import { useTags, useCreateTag, useDeleteTag } from "@/hooks/api/task/use-tags";

import type { Tag } from "@/types/task/tag";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

import { getTagColor } from "@/lib/task/task";

interface TaskTagsSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  boardGUID: string;
  disabled?: boolean;
  isModalOpen?: boolean;
  showInfoIcon?: boolean;
}

export function TaskTagsSelector({
  selectedTags,
  onTagsChange,
  boardGUID,
  disabled = false,
  isModalOpen = true,
  showInfoIcon = false,
}: TaskTagsSelectorProps) {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [showDeleteTagConfirm, setShowDeleteTagConfirm] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const { data: boardTagsResponse } = useTags(
    {
      strBoardGUID: boardGUID,
    },
    { enabled: showTagDropdown && isModalOpen }
  );
  const boardTags = Array.isArray(boardTagsResponse) ? boardTagsResponse : [];

  const createTagMutation = useCreateTag();
  const deleteTagMutation = useDeleteTag();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-tag-dropdown]")) {
        setShowTagDropdown(false);
      }
    };

    if (showTagDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTagDropdown]);

  useEffect(() => {
    if (disabled && showTagDropdown) {
      setShowTagDropdown(false);
    }
  }, [disabled, showTagDropdown]);

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
  };

  const createNewTag = async () => {
    if (
      tagSearchQuery.trim() &&
      !selectedTags.includes(tagSearchQuery.trim())
    ) {
      const newTag = tagSearchQuery.trim();

      await createTagMutation.mutateAsync({
        strBoardGUID: boardGUID,
        strTagName: newTag,
      });

      onTagsChange([...(selectedTags || []), newTag]);
      setTagSearchQuery("");
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    await deleteTagMutation.mutateAsync({ id: tag.strTagGUID });
    const newSelectedTags = selectedTags.filter(
      (tagName) => tagName !== tag.strTagName
    );
    onTagsChange(newSelectedTags);
    setShowDeleteTagConfirm(false);
    setTagToDelete(null);
  };

  const confirmDeleteTag = (tag: Tag) => {
    setTagToDelete(tag);
    setShowDeleteTagConfirm(true);
  };

  const allFilteredTags = boardTags.filter((tag: Tag) =>
    tag.strTagName.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Tags</Label>
          {showInfoIcon && (
            <span
              className="cursor-help"
              title="To add tags, select a board first"
            >
              <Info className="h-4 w-4 text-muted-foreground" />
            </span>
          )}
        </div>
        <div className={disabled ? "opacity-60 pointer-events-none" : ""}>
          <div className="relative" data-tag-dropdown>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal h-auto min-h-10 px-3 py-2 rounded-md"
              onClick={() => !disabled && setShowTagDropdown(!showTagDropdown)}
              disabled={disabled}
            >
              <div className="flex items-center gap-2 w-full">
                <TagIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                {selectedTags.length > 0 ? (
                  <div className="w-full flex items-center gap-1 flex-wrap">
                    {selectedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded border border-border bg-muted/80 text-foreground flex items-center gap-1"
                      >
                        <div
                          className="h-3 w-3 rounded"
                          style={{
                            backgroundColor: getTagColor(tag),
                          }}
                        ></div>
                        {tag}
                        {!disabled && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTag(tag);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleTag(tag);
                              }
                            }}
                            className="hover:bg-muted rounded cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  "No tags added +"
                )}
              </div>
            </Button>

            {showTagDropdown && !disabled && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
                <div className="p-2 border-b border-border">
                  <div className="flex gap-1">
                    <Input
                      type="text"
                      placeholder="Search or add tag..."
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      className="flex-1 h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          createNewTag();
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="max-h-32 overflow-y-auto">
                  {allFilteredTags.length > 0 ? (
                    <div className="p-1">
                      {allFilteredTags.map((tag: Tag, index: number) => {
                        const isSelected = selectedTags.includes(
                          tag.strTagName
                        );
                        return (
                          <div
                            key={index}
                            className="w-full flex items-center gap-2 pl-2 pr-2 py-1 text-sm hover:bg-muted rounded group"
                          >
                            <button
                              type="button"
                              onClick={() => toggleTag(tag.strTagName)}
                              className="flex-1 text-left flex items-center gap-2"
                            >
                              <div
                                className="h-3 w-3 rounded"
                                style={{
                                  backgroundColor: getTagColor(tag.strTagName),
                                }}
                              ></div>
                              {tag.strTagName}
                            </button>
                            <div className="flex items-center gap-1">
                              {isSelected && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDeleteTag(tag);
                                }}
                                className="p-1 hover:bg-destructive/10 rounded"
                                title="Delete tag permanently"
                              >
                                <X className="h-3 w-3 text-destructive" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {tagSearchQuery
                        ? "No matching tags found"
                        : "No available tags"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        title="Delete Tag"
        description={`Are you sure you want to delete the tag "${tagToDelete?.strTagName}"? This will permanently remove the tag from the board and all tasks using it. This action cannot be undone.`}
        open={showDeleteTagConfirm}
        onOpenChange={setShowDeleteTagConfirm}
        onConfirm={() => tagToDelete && handleDeleteTag(tagToDelete)}
        isLoading={deleteTagMutation.isPending}
      />
    </>
  );
}
