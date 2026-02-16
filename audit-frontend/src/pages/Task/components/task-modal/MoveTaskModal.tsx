import { useState } from "react";
import { toast } from "sonner";

import { useMoveTask } from "@/hooks/api/task/use-task";
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

interface MoveTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskGUID: string | null;
  boards: BoardInfo[];
  onSuccess?: () => void;
  boardSectionsData?: BoardSectionSimple[];
}

export function MoveTaskModal({
  open,
  onOpenChange,
  taskGUID,
  boards,
  onSuccess,
  boardSectionsData,
}: MoveTaskModalProps) {
  const [targetBoardGUID, setTargetBoardGUID] = useState<string>("");
  const [targetSectionGUID, setTargetSectionGUID] = useState<string>("");

  const moveTaskMutation = useMoveTask();

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

  const handleMoveTask = async () => {
    if (!taskGUID || !targetBoardGUID || !targetSectionGUID) {
      toast.error("Please select a project and module");
      return;
    }

    await moveTaskMutation.mutateAsync({
      taskGuid: taskGUID,
      request: {
        strBoardGUID: targetBoardGUID,
        strBoardSectionGUID: targetSectionGUID,
        intPosition: 0,
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
      title="Move Task"
      description="Select a project and section to move this task to."
      maxWidth="500px"
      footerContent={
        <div className="flex w-full justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleMoveTask}
            disabled={!targetSectionGUID || moveTaskMutation.isPending}
          >
            {moveTaskMutation.isPending ? "Moving..." : "Move Task"}
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
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {boards.map((board) => (
                <SelectItem key={board.strBoardGUID} value={board.strBoardGUID}>
                  {board.strBoardName || "Unnamed project"}
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
            disabled={!targetBoardGUID}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  targetBoardGUID ? "Select a module" : "Select a project first"
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
