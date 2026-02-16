import { useMemo } from "react";

import { useTasks } from "@/hooks";

import type { Task } from "@/types/task/task";

import { TaskCard } from "@/pages/Task/components/cards/TaskCard";
import {
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";

const STATUS_COLUMNS = [
  { id: "status-notstarted", name: "Not Started", color: "bg-gray-600" },
  { id: "status-started", name: "Started", color: "bg-blue-500" },
  { id: "status-onhold", name: "On Hold", color: "bg-yellow-500" },
  { id: "status-completed", name: "Completed", color: "bg-green-500" },
  { id: "status-incomplete", name: "Incomplete", color: "bg-gray-500" },
  { id: "status-forreview", name: "For Review", color: "bg-red-500" },
  { id: "status-reassign", name: "Reassign", color: "bg-purple-500" },
];

export default function StatusView({
  board,
  statusFilter = [],
}: {
  board: { strBoardGUID: string };
  statusFilter?: string[];
}) {
  const { data: tasksResponse } = useTasks({
    strBoardGUID: board.strBoardGUID,
    strStatus: statusFilter.length ? statusFilter.join(",") : undefined,
  });

  const tasks: Task[] = useMemo(() => {
    return tasksResponse || [];
  }, [tasksResponse]);

  const data = useMemo(
    () =>
      tasks.map((t) => ({
        id: t.strTaskGUID,
        name: t.strTitle,
        column:
          t.strStatus === "Started"
            ? "status-started"
            : t.strStatus === "On Hold"
              ? "status-onhold"
              : t.strStatus === "Completed"
                ? "status-completed"
                : t.strStatus === "Incomplete"
                  ? "status-incomplete"
                  : t.strStatus === "For Review"
                    ? "status-forreview"
                    : t.strStatus === "Reassign"
                      ? "status-reassign"
                      : "status-notstarted",
      })),
    [tasks]
  );

  return (
    <>
      <KanbanProvider columns={STATUS_COLUMNS} data={data} disabled={true}>
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
                  />
                );
              }}
            </KanbanCards>
            {/* Empty state per column */}
            {(() => {
              const tasksInColumn = tasks.filter((t) => {
                const map = {
                  "Not Started": "status-notstarted",
                  Started: "status-started",
                  "On Hold": "status-onhold",
                  Completed: "status-completed",
                  Incomplete: "status-incomplete",
                  "For Review": "status-forreview",
                  Reassign: "status-reassign",
                } as const;
                const col =
                  map[t.strStatus as keyof typeof map] ?? "status-notstarted";
                return col === column.id;
              });
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
