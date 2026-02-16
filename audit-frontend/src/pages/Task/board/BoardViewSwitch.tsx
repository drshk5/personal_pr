import React from "react";
import type { Board } from "@/types/task/board";
import type { ViewType } from "@/types/task/board-section";
import { VIEW_TYPE } from "@/types/task/board-section";
import KanbanSectionView from "./views/KanbanSectionView";
import ListSectionView from "./views/ListSectionView";
import PriorityView from "./views/PriorityView";
import DueDateView from "./views/DueDateView";
import StatusView from "./views/StatusView";
import AssigneeView from "./views/AssigneeView";
import CalenderView from "./views/CalenderView";

type Props = {
  board: Board;
  view: ViewType;
  onCancelCreation?: () => void;
  statusFilter?: string[];
};

const BoardViewSwitch: React.FC<Props> = ({
  board,
  view,
  onCancelCreation,
  statusFilter = [],
}) => {
  switch (view) {
    case VIEW_TYPE.Section:
      return (
        <KanbanSectionView board={board} onCancelCreation={onCancelCreation} statusFilter={statusFilter} />
      );
    case VIEW_TYPE.Kanban:
      return (
        <KanbanSectionView board={board} onCancelCreation={onCancelCreation} statusFilter={statusFilter} />
      );
    case VIEW_TYPE.List:
      return (
        <ListSectionView board={board} onCancelCreation={onCancelCreation} statusFilter={statusFilter} />
      );
    case VIEW_TYPE.Priority:
      return <PriorityView board={board} statusFilter={statusFilter} />;
    case VIEW_TYPE.DueDate:
      return <DueDateView board={board} statusFilter={statusFilter} />;
    case VIEW_TYPE.Status:
      return <StatusView board={board} />;
    case VIEW_TYPE.Assignee:
      return <AssigneeView board={board} statusFilter={statusFilter} />;
    case VIEW_TYPE.Calendar:
      return <CalenderView board={board} statusFilter={statusFilter} />;
    case VIEW_TYPE.Gantt:
    default:
      return null;
  }
};

export default BoardViewSwitch;
