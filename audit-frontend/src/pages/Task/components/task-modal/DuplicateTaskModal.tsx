import { useState } from "react";

import { useDuplicateTask } from "@/hooks/api/task/use-task";
import { useBoardSectionsByBoardGuid } from "@/hooks/api/task/use-board-sections";

import type { BoardInfo } from "@/types/task/board-team";
import type { BoardSectionSimple } from "@/types/task/board-section";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { ModalDialog } from "@/components/ui/modal-dialog";

interface DuplicateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskGUID: string | null;
  boards: BoardInfo[];
  onSuccess?: () => void;
  isPrivate?: boolean;
  boardSectionsData?: BoardSectionSimple[];
}

export function DuplicateTaskModal({
  open,
  onOpenChange,
  taskGUID,
  boards,
  onSuccess,
  isPrivate = false,
  boardSectionsData,
}: DuplicateTaskModalProps) {
  const [targetBoardGUID, setTargetBoardGUID] = useState<string>("");
  const [targetSectionGUID, setTargetSectionGUID] = useState<string>("");

  const duplicateTaskMutation = useDuplicateTask();

  const { data: fetchedBoardSectionsResponse } = useBoardSectionsByBoardGuid(
    targetBoardGUID && boardSectionsData ? targetBoardGUID : undefined,
    undefined,
    open
  );

  const fetchedBoardSectionsData = fetchedBoardSectionsResponse?.data || [];

  const targetBoardSections =
    boardSectionsData && !targetBoardGUID
      ? boardSectionsData
      : fetchedBoardSectionsData || [];

  const handleClose = () => {
    setTargetBoardGUID("");
    setTargetSectionGUID("");
    onOpenChange(false);
  };

  const handleDuplicateTask = async () => {
    if (!taskGUID) return;

    await duplicateTaskMutation.mutateAsync({
      taskGuid: taskGUID,
      request: {
        strBoardGUID: targetBoardGUID || null,
        strBoardSectionGUID: targetSectionGUID || null,
      },
    });

    handleClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Duplicate Task"
      description={
        isPrivate
          ? "Duplicating a private task. The duplicated task will also be private."
          : "Optionally select a project and module for the duplicated task."
      }
      maxWidth="500px"
      footerContent={
        <div className="flex w-full justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDuplicateTask}
            disabled={duplicateTaskMutation.isPending}
          >
            {duplicateTaskMutation.isPending
              ? "Duplicating..."
              : "Duplicate Task"}
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Select Project</Label>
          <Select
            value={targetBoardGUID}
            onValueChange={(value) => {
              setTargetBoardGUID(value);
              setTargetSectionGUID("");
            }}
            disabled={isPrivate}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isPrivate
                    ? "Not available for private tasks"
                    : "Select a project"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {boards.map((board) => (
                <SelectItem key={board.strBoardGUID} value={board.strBoardGUID}>
                  {board.strBoardName || "Unnamed Board"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Select Module</Label>
          <Select
            value={targetSectionGUID}
            onValueChange={setTargetSectionGUID}
            disabled={isPrivate}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isPrivate
                    ? "Not available for private tasks"
                    : "Select a module"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {targetBoardSections.map((section: BoardSectionSimple) => (
                <SelectItem
                  key={section.strBoardSectionGUID}
                  value={section.strBoardSectionGUID}
                >
                  {section.strName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </ModalDialog>
  );
}
