import { useMemo } from "react";

import { useTasks, useBoardTeamMembers } from "@/hooks";

import type { Task } from "@/types/task/task";

import { DEFAULT_USER_COLORS } from "@/constants/Task/task";

import { TaskCard } from "@/pages/Task/components/cards/TaskCard";
import {
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";
import { BoardSkeleton } from "@/pages/Task/board/BoardSkeleton";

export default function AssigneeView({
  board,
  statusFilter = [],
}: {
  board: { strBoardGUID: string };
  statusFilter?: string[];
}) {
  const { data: tasksResponse, isLoading: tasksLoading } = useTasks({
    strBoardGUID: board.strBoardGUID,
    strStatuses: statusFilter.length ? statusFilter.join(",") : undefined,
  });
  const tasks: Task[] = useMemo(() => {
    return tasksResponse || [];
  }, [tasksResponse]);

  const { data: boardTeamData, isLoading: teamLoading } = useBoardTeamMembers(board.strBoardGUID);

  const columns = useMemo(() => {
    const users = boardTeamData?.data || [];
    return users.map((u, idx) => ({
      id: u.strUserGUID,
      name: u.strUserName || "Unknown User",
      color: DEFAULT_USER_COLORS[idx % DEFAULT_USER_COLORS.length],
    }));
  }, [boardTeamData]);

  const data = useMemo(
    () =>
      tasks
        .filter((t) => !!t.strAssignedToGUID)
        .map((t) => ({
          id: t.strTaskGUID,
          name: t.strTitle,
          column: t.strAssignedToGUID as string,
        })),
    [tasks]
  );

  if (tasksLoading || teamLoading) {
    return <BoardSkeleton />;
  }

  return (
    <>
      <KanbanProvider columns={columns} data={data} disabled={true}>
        {(column) => (
          <KanbanBoard key={column.id} id={column.id}>
            <KanbanHeader className={`${column.color} text-white`}>
              {column.name}
            </KanbanHeader>
            <KanbanCards id={column.id}>
              {(card) => {
                const task = tasks.find((t) => t.strTaskGUID === card.id);
                if (!task) return null;
                return (
                  <TaskCard
                    key={task.strTaskGUID}
                    task={task}
                    variant="compact"
                    showAssignee={true}
                    showDates={true}
                    showPriority={true}
                    showProgress={false}
                    showTags={true}
                    className="cursor-default"
                  />
                );
              }}
            </KanbanCards>
            {/* Empty state per column */}
            {(() => {
              const tasksInColumn = data.filter(
                (item) => item.column === column.id
              );
              return tasksInColumn.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center h-full">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      No Tasks
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </KanbanBoard>
        )}
      </KanbanProvider>
    </>
  );
}
