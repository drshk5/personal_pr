import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  useAddReview,
  useUpdateReview,
  useDeleteReview,
} from "@/hooks/api/task/use-review-task";
import type { ReviewTask } from "@/types/task/review-task";

type ReviewModalMode = "add" | "edit" | "delete";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ReviewModalMode;
  taskGUID?: string;
  review?: ReviewTask | null;
}

export function ReviewModal({
  open,
  onOpenChange,
  mode,
  taskGUID,
  review,
}: ReviewModalProps) {
  const [reviewText, setReviewText] = useState("");
  const addReviewMutation = useAddReview();
  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();

  useEffect(() => {
    if (mode === "edit" && review) {
      setReviewText(review.strReview || "");
    } else if (mode === "add") {
      setReviewText("");
    }
  }, [mode, review, open]);

  const handleSubmit = () => {
    if (mode === "add") {
      if (!reviewText.trim() || !taskGUID) return;

      addReviewMutation.mutate(
        {
          strTaskGUID: taskGUID,
          strReview: reviewText.trim(),
        },
        {
          onSuccess: () => {
            setReviewText("");
            onOpenChange(false);
          },
        }
      );
    } else if (mode === "edit") {
      if (!reviewText.trim() || !review) return;

      updateReviewMutation.mutate(
        {
          reviewTaskGuid: review.strReviewTaskGUID,
          data: {
            strReview: reviewText.trim(),
          },
        },
        {
          onSuccess: () => {
            setReviewText("");
            onOpenChange(false);
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!review) return;

    deleteReviewMutation.mutate(
      {
        reviewTaskGuid: review.strReviewTaskGUID,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleCancel = () => {
    setReviewText("");
    onOpenChange(false);
  };

  const isLoading =
    addReviewMutation.isPending ||
    updateReviewMutation.isPending ||
    deleteReviewMutation.isPending;

  // Modal configuration based on mode
  const modalConfig = {
    add: {
      title: "Add Review",
      description: "Write your review for this task.",
    },
    edit: {
      title: "Edit Review",
      description: "Update your review for this task.",
    },
    delete: {
      title: "Delete Review",
      description:
        "Are you sure you want to delete this review? This action cannot be undone.",
    },
  };

  if (mode === "delete") {
    return (
      <ConfirmationDialog
        open={open}
        onOpenChange={onOpenChange}
        onConfirm={handleDelete}
        title="Delete Review"
        description={
          review?.strReview
            ? `Are you sure you want to delete this review? This action cannot be undone.\n\n"${review.strReview}"`
            : "Are you sure you want to delete this review? This action cannot be undone."
        }
        confirmLabel="Delete"
        variant="warning"
        isLoading={isLoading}
        loadingText="Deleting..."
      />
    );
  }

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={modalConfig[mode].title}
      description={modalConfig[mode].description}
      maxWidth="500px"
      showCloseButton={true}
      footerContent={
        <>
          <div />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!reviewText.trim() || isLoading}
            >
              {isLoading
                ? mode === "add"
                  ? "Adding..."
                  : "Updating..."
                : mode === "add"
                  ? "Add Review"
                  : "Update Review"}
            </Button>
          </div>
        </>
      }
    >
      <div className="px-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="review-text">Review</Label>
          <Textarea
            id="review-text"
            className="min-h-28"
            placeholder="Write your review..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            autoFocus
          />
        </div>
      </div>
    </ModalDialog>
  );
}
