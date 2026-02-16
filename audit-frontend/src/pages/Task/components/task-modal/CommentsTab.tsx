import { useState } from "react";
import {
  MessageSquare,
  ThumbsUp,
  Send,
  MoreVertical,
  Reply,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, getImagePath } from "@/lib/utils";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import {
  useTaskComments,
  useCreateTaskComment,
  useUpdateTaskComment,
  useDeleteTaskComment,
  useLikeTaskComment,
} from "@/hooks/api/task/use-task-comment";
import type { TaskComment } from "@/types/task/task-comment";

interface CommentsTabProps {
  taskGuid?: string;
  readOnly?: boolean;
}

export function CommentsTab({ taskGuid, readOnly = false }: CommentsTabProps) {
  const { user } = useAuthContext();
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const { data: comments = [], isLoading } = useTaskComments(taskGuid);
  const createCommentMutation = useCreateTaskComment();
  const updateCommentMutation = useUpdateTaskComment();
  const deleteCommentMutation = useDeleteTaskComment();
  const likeCommentMutation = useLikeTaskComment();

  // Helper function to check if HTML content is empty
  const isContentEmpty = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return !div.textContent?.trim();
  };

  const handleAddComment = async () => {
    if (!taskGuid || !newComment.trim() || isContentEmpty(newComment)) return;

    try {
      await createCommentMutation.mutateAsync({
        strTaskGUID: taskGuid,
        strContent: newComment,
        strParentCommentGUID: null,
        bolIsPrivate: false,
      });

      setNewComment("");
    } catch {
      // Error is handled by mutation
    }
  };

  const handleAddReply = async (parentGuid: string) => {
    if (!taskGuid || !replyContent.trim() || isContentEmpty(replyContent))
      return;

    try {
      await createCommentMutation.mutateAsync({
        strTaskGUID: taskGuid,
        strContent: replyContent,
        strParentCommentGUID: parentGuid,
        bolIsPrivate: false,
      });

      setReplyContent("");
      setReplyToCommentId(null);
    } catch {
      // Error is handled by mutation
    }
  };

  const handleUpdateComment = async (commentGuid: string) => {
    if (!editContent.trim() || isContentEmpty(editContent)) return;

    await updateCommentMutation.mutateAsync({
      commentGuid,
      data: { strContent: editContent },
    });

    setEditingCommentId(null);
    setEditContent("");
  };

  const handleDeleteComment = async (commentGuid: string) => {
    if (!taskGuid) return;

    await deleteCommentMutation.mutateAsync({
      commentGuid,
      taskGuid,
    });
  };

  const handleLikeComment = async (commentGuid: string, isLiked: boolean) => {
    await likeCommentMutation.mutateAsync({
      commentGuid,
      payload: { isLike: !isLiked },
    });

    // Update local liked state
    setLikedComments((prev) => {
      const newSet = new Set(prev);
      if (!isLiked) {
        newSet.add(commentGuid);
      } else {
        newSet.delete(commentGuid);
      }
      return newSet;
    });
  };

  const startEdit = (comment: TaskComment) => {
    setEditingCommentId(comment.strCommentGUID);
    setEditContent(comment.strContent);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const startReply = (commentGuid: string) => {
    setReplyToCommentId(commentGuid);
  };

  const cancelReply = () => {
    setReplyToCommentId(null);
    setReplyContent("");
  };

  const renderComment = (comment: TaskComment, isReply = false) => {
    const isEditing = editingCommentId === comment.strCommentGUID;
    const isReplying = replyToCommentId === comment.strCommentGUID;
    const isOwnComment = user?.strUserGUID === comment.strCreatedByGUID;
    const isLiked = likedComments.has(comment.strCommentGUID);

    const parentComment = comment.strParentCommentGUID
      ? findCommentById(comments, comment.strParentCommentGUID)
      : null;

    return (
      <div key={comment.strCommentGUID} className="space-y-2 sm:space-y-3">
        <div
          className={`flex gap-2 sm:gap-3 ${isReply ? "ml-6 sm:ml-10" : ""}`}
        >
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
            <AvatarImage
              src={getImagePath(comment.strProfileImg || "") as string}
              alt={comment.strCreatedByName || "User"}
            />
            <AvatarFallback className="text-[10px] sm:text-xs bg-primary/10 text-primary">
              {(comment.strCreatedByName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 mb-1">
              <span className="text-xs sm:text-sm font-medium text-primary wrap-break-word">
                {comment.strCreatedByName || "Unknown User"}
              </span>
              {parentComment && (
                <span className="text-[10px] sm:text-xs text-muted-foreground wrap-break-word">
                  replied to {parentComment.strCreatedByName || "Unknown User"}
                  's comment
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <RichTextEditor
                  content={editContent}
                  onChange={setEditContent}
                  placeholder="Edit your comment..."
                  maxHeight={80}
                  autoFocus={true}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleUpdateComment(comment.strCommentGUID);
                    }}
                    disabled={
                      updateCommentMutation.isPending ||
                      !editContent.trim() ||
                      isContentEmpty(editContent)
                    }
                    type="button"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      cancelEdit();
                    }}
                    type="button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="text-xs sm:text-sm text-foreground mb-2 prose prose-sm prose-invert max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 wrap-break-word"
                  dangerouslySetInnerHTML={{ __html: comment.strContent }}
                />
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                  <span>{formatDate(comment.dtCreatedOn, true)}</span>
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLikeComment(comment.strCommentGUID, isLiked);
                        }}
                        className={`hover:text-primary transition-colors flex items-center gap-1 ${
                          isLiked ? "text-primary" : ""
                        }`}
                        disabled={likeCommentMutation.isPending}
                        title={isLiked ? "Unlike" : "Like"}
                      >
                        <ThumbsUp
                          className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                          fill={isLiked ? "currentColor" : "none"}
                        />
                        {comment.intLikeCount > 0 && (
                          <span>{comment.intLikeCount}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          startReply(comment.strCommentGUID);
                        }}
                        className="hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <Reply className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="hidden xs:inline">Reply</span>
                      </button>
                    </>
                  )}
                  {isOwnComment && !readOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="hover:text-primary transition-colors">
                          <MoreVertical className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(comment)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteComment(comment.strCommentGUID)
                          }
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {isReplying && !readOnly && (
          <div
            className={`flex gap-2 sm:gap-3 ${isReply ? "ml-6 sm:ml-10" : ""}`}
          >
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
              <AvatarImage
                src={getImagePath(user?.strProfileImg || "") as string}
                alt={user?.strName || "User"}
              />
              <AvatarFallback className="text-[10px] sm:text-xs bg-primary/10 text-primary">
                {(user?.strName || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <RichTextEditor
                content={replyContent}
                onChange={setReplyContent}
                placeholder={`Reply to ${comment.strCreatedByName}...`}
                maxHeight={80}
                autoFocus={true}
                className="w-full"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddReply(comment.strCommentGUID);
                  }}
                  disabled={
                    createCommentMutation.isPending ||
                    !replyContent.trim() ||
                    isContentEmpty(replyContent)
                  }
                  type="button"
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    cancelReply();
                  }}
                  type="button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  const topLevelComments = comments.filter((c) => !c.strParentCommentGUID);

  // Helper to find a comment by GUID in nested structure
  const findCommentById = (
    commentList: TaskComment[],
    guid: string
  ): TaskComment | null => {
    for (const comment of commentList) {
      if (comment.strCommentGUID === guid) {
        return comment;
      }
      if (comment.replies && comment.replies.length > 0) {
        const found = findCommentById(comment.replies, guid);
        if (found) return found;
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Comment input */}
      {!readOnly && (
        <div className="flex gap-2">
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
            <AvatarImage
              src={getImagePath(user?.strProfileImg || "") as string}
              alt={user?.strName || "User"}
            />
            <AvatarFallback className="text-[10px] sm:text-xs bg-primary/10 text-primary">
              {(user?.strName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <RichTextEditor
              content={newComment}
              onChange={setNewComment}
              placeholder="Your thoughts on this..."
              maxHeight={80}
              autoFocus={false}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                handleAddComment();
              }}
              disabled={
                createCommentMutation.isPending ||
                !newComment.trim() ||
                isContentEmpty(newComment)
              }
              className="shrink-0 self-end sm:self-auto"
              type="button"
            >
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No comments yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Be the first to share your thoughts on this task
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {topLevelComments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
