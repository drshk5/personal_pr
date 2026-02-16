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

const PRIORITY_COLUMNS = [
  { id: "priority-high", name: "High", color: "bg-red-500" },
  { id: "priority-medium", name: "Medium", color: "bg-orange-500" },
  { id: "priority-low", name: "Low", color: "bg-green-500" },
  { id: "priority-none", name: "None", color: "bg-gray-500" },
];

export default function PriorityView({
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
          t.strPriority === "High"
            ? "priority-high"
            : t.strPriority === "Medium"
              ? "priority-medium"
              : t.strPriority === "Low"
                ? "priority-low"
                : "priority-none",
      })),
    [tasks]
  );

  return (
    <>
      <KanbanProvider columns={PRIORITY_COLUMNS} data={data} disabled={true}>
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
                  High: "priority-high",
                  Medium: "priority-medium",
                  Low: "priority-low",
                  None: "priority-none",
                } as const;
                const col =
                  map[t.strPriority as keyof typeof map] ?? "priority-none";
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
