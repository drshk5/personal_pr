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

const DUE_COLUMNS = [
  { id: "due-overdue", name: "Overdue", color: "bg-red-500" },
  { id: "due-today", name: "Today", color: "bg-blue-500" },
  { id: "due-upcoming", name: "Upcoming", color: "bg-green-500" },
  { id: "due-noduedate", name: "No Due Date", color: "bg-gray-500" },
];

export default function DueDateView({
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

  const toDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const normalized = new Date(year, month, day, 0, 0, 0, 0);
    return normalized.getTime();
  };

  const data = useMemo(() => {
    const todayKey = toDateKey(new Date());
    return tasks.map((t) => {
      let column = "due-noduedate";
      if (t.dtDueDate) {
        const dueKey = toDateKey(new Date(t.dtDueDate));
        if (dueKey < todayKey) column = "due-overdue";
        else if (dueKey === todayKey) column = "due-today";
        else column = "due-upcoming";
      }
      return {
        id: t.strTaskGUID,
        name: t.strTitle,
        column,
      };
    });
  }, [tasks]);

  return (
    <>
      <KanbanProvider columns={DUE_COLUMNS} data={data}>
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
              const todayKey = (() => {
                const d = new Date();
                return new Date(
                  d.getFullYear(),
                  d.getMonth(),
                  d.getDate()
                ).getTime();
              })();
              const toKey = (d?: string | null) =>
                d ? new Date(new Date(d)).setHours(0, 0, 0, 0) : null;
              const tasksInColumn = tasks.filter((t) => {
                let col = "due-noduedate";
                if (t.dtDueDate) {
                  const dueKey = toKey(t.dtDueDate)!;
                  if (dueKey < todayKey) col = "due-overdue";
                  else if (dueKey === todayKey) col = "due-today";
                  else col = "due-upcoming";
                }
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
