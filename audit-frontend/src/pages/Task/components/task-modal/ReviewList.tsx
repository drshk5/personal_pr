import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { PlusCircle, Info, Pencil, Trash2, Send } from "lucide-react";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import type { ReviewTask } from "@/types/task/review-task";
import {
  useAddReview,
  useUpdateReview,
  useDeleteReview,
} from "@/hooks/api/task/use-review-task";
import { WithPermission } from "@/components/ui/with-permission";
import { Actions, ModuleBase } from "@/lib/permissions";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

interface ReviewListProps {
  reviews?: ReviewTask[];
  taskGUID: string;
  showAddButton?: boolean;
}

export function ReviewList({
  reviews = [],
  taskGUID,
  showAddButton = false,
}: ReviewListProps) {
  const { user } = useAuthContext();
  const [hoveredReview, setHoveredReview] = useState<string | null>(null);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [newReviewContent, setNewReviewContent] = useState("");
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingReview, setDeletingReview] = useState<ReviewTask | null>(null);

  const addReviewMutation = useAddReview();
  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();

  const canEditReview = (review: ReviewTask) => {
    return user?.strUserGUID === review.strCreatedByGUID;
  };

  const handleAddReview = async () => {
    if (!taskGUID || !newReviewContent.trim()) return;

    try {
      await addReviewMutation.mutateAsync({
        strTaskGUID: taskGUID,
        strReview: newReviewContent,
      });

      setNewReviewContent("");
      setIsAddingReview(false);
    } catch {
      // Error is handled by mutation
    }
  };

  const handleUpdateReview = async (reviewGUID: string) => {
    if (!editContent.trim()) return;

    try {
      await updateReviewMutation.mutateAsync({
        reviewTaskGuid: reviewGUID,
        data: { strReview: editContent },
      });

      setEditingReview(null);
      setEditContent("");
    } catch {
      // Error is handled by mutation
    }
  };

  const handleDeleteReview = async () => {
    if (!deletingReview) return;

    try {
      await deleteReviewMutation.mutateAsync({
        reviewTaskGuid: deletingReview.strReviewTaskGUID,
      });
      setDeletingReview(null);
    } catch {
      // Error is handled by mutation
    }
  };

  const startEdit = (review: ReviewTask) => {
    setEditingReview(review.strReviewTaskGUID);
    setEditContent(review.strReview || "");
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setEditContent("");
  };

  const cancelAdd = () => {
    setIsAddingReview(false);
    setNewReviewContent("");
  };

  if (reviews.length === 0 && !isAddingReview) {
    return (
      <>
        <div className="mt-2 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs sm:text-sm">Reviews</Label>
            {showAddButton && (
              <WithPermission
                module={ModuleBase.REVIEW_TASK}
                action={Actions.SAVE}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingReview(true)}
                  className="text-xs h-8"
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  <span className="hidden xs:inline">Add Review</span>
                  <span className="xs:hidden">Add</span>
                </Button>
              </WithPermission>
            )}
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Info className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No reviews yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Reviews will appear here once added
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mt-2 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs sm:text-sm">Reviews</Label>
          {showAddButton && !isAddingReview && (
            <WithPermission
              module={ModuleBase.REVIEW_TASK}
              action={Actions.SAVE}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingReview(true)}
                className="text-xs h-8"
              >
                <PlusCircle className="h-3 w-3 mr-1" />
                <span className="hidden xs:inline">Add Review</span>
                <span className="xs:hidden">Add</span>
              </Button>
            </WithPermission>
          )}
        </div>

        {/* Reviews List */}
        <ul className="space-y-2">
          {/* Add Review Form */}
          {isAddingReview && (
            <li className="rounded-md border border-border-color bg-muted/30 p-2 sm:p-3">
              <div className="flex gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs sm:text-sm shrink-0">
                  {(user?.strName || "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={newReviewContent}
                    onChange={(e) => setNewReviewContent(e.target.value)}
                    placeholder="Write your review..."
                    className="min-h-20 resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddReview}
                      disabled={
                        !newReviewContent.trim() || addReviewMutation.isPending
                      }
                      type="button"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {addReviewMutation.isPending ? "Adding..." : "Add Review"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelAdd}
                      type="button"
                      disabled={addReviewMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          )}
          {reviews.map((r) => {
            const canEdit = canEditReview(r);
            const isHovered = hoveredReview === r.strReviewTaskGUID;
            const isEditing = editingReview === r.strReviewTaskGUID;

            return (
              <li
                key={r.strReviewTaskGUID}
                className="rounded-md border border-border-color bg-muted/30 p-2 sm:p-3 relative group"
                onMouseEnter={() => setHoveredReview(r.strReviewTaskGUID)}
                onMouseLeave={() => setHoveredReview(null)}
              >
                <div className="flex items-start gap-2">
                  {(() => {
                    const initial = (r.strCreatedBy || "U")
                      .charAt(0)
                      .toUpperCase();
                    return (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs sm:text-sm shrink-0">
                        {initial}
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm mb-1">
                      <span className="font-medium text-foreground wrap-break-word">
                        {r.strCreatedBy || "Reviewer"}
                      </span>
                      {r.dtUpdatedOn && (
                        <span className="text-muted-foreground text-[10px] sm:text-xs">
                          {" "}
                          (edited)
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Edit your review..."
                          className="min-h-20 resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleUpdateReview(r.strReviewTaskGUID)
                            }
                            disabled={
                              !editContent.trim() ||
                              updateReviewMutation.isPending
                            }
                            type="button"
                          >
                            {updateReviewMutation.isPending
                              ? "Saving..."
                              : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            type="button"
                            disabled={updateReviewMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs sm:text-sm text-foreground whitespace-pre-wrap wrap-break-word">
                          {r.strReview}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          {formatDate(r.dtCreatedOn, true)}
                        </div>
                      </>
                    )}
                  </div>

                  {canEdit && isHovered && !isEditing && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => startEdit(r)}
                        className="hover:text-primary transition-colors p-1"
                        type="button"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingReview(r)}
                        className="hover:text-destructive transition-colors p-1"
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <DeleteConfirmationDialog
        open={!!deletingReview}
        onOpenChange={(open) => !open && setDeletingReview(null)}
        onConfirm={handleDeleteReview}
        title="Delete Review"
        description="Are you sure you want to delete this review? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteReviewMutation.isPending}
      />
    </>
  );
}
