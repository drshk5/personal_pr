import { useMemo, useState } from "react";

import { useTasks } from "@/hooks";

import type { Task } from "@/types/task/task";

import { STATUS_COLOR } from "@/constants/Task/task";

import TaskDetailsDrawer from "./TaskDetailsDrawer";
import {
  CalendarBody,
  CalendarDate,
  CalendarDatePagination,
  CalendarHeader,
  CalendarItem,
  CalendarProvider,
  monthsForLocale,
  useCalendarMonth,
  useCalendarYear,
} from "@/components/ui/shadcn-io/calendar";

type Feature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: { id: string; name: string; color: string };
};

export default function CalenderView({
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
    return Array.isArray(tasksResponse)
      ? (tasksResponse as Task[])
      : (tasksResponse as { data?: Task[] } | undefined)?.data || [];
  }, [tasksResponse]);

  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [month] = useCalendarMonth();
  const [year] = useCalendarYear();

  const monthLabel = useMemo(() => {
    return monthsForLocale("en-US", "long")[month];
  }, [month]);

  const features = useMemo<Feature[]>(() => {
    return tasks
      .filter((t) => !!t.dtDueDate)
      .map((t) => {
        const due = new Date(t.dtDueDate as string);
        return {
          id: t.strTaskGUID,
          name: t.strTitle,
          startAt: due,
          endAt: due,
          status: {
            id: t.strStatus || "Not Started",
            name: t.strStatus || "Not Started",
            color:
              STATUS_COLOR[t.strStatus as keyof typeof STATUS_COLOR] ||
              "#6B7280",
          },
        };
      });
  }, [tasks]);

  const handleTaskClick = (taskId: string) => {
    setDrawerTaskId(taskId);
  };

  return (
    <>
      <CalendarProvider
        className="rounded-md border border-border-color bg-muted/50"
        disabled={false}
      >
        <CalendarDate>
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm font-medium text-foreground">
              {monthLabel}
            </span>
            <span className="text-sm font-medium text-foreground">{year}</span>
          </div>
          <CalendarDatePagination />
        </CalendarDate>
        <CalendarHeader className="border border-border-color bg-muted/20" />
        <CalendarBody
          features={features}
          onDayClick={undefined}
          onDayDrop={undefined}
          disableBefore={new Date(new Date().setHours(0, 0, 0, 0))}
        >
          {({ feature }) => (
            <div
              key={feature.id}
              onClick={(e) => {
                e.stopPropagation();
                handleTaskClick(feature.id);
              }}
            >
              <CalendarItem
                feature={feature}
                className="px-2 py-1 rounded bg-neutral-600 text-white shadow-sm border border-border-color transition-colors text-xs cursor-pointer"
              />
            </div>
          )}
        </CalendarBody>
      </CalendarProvider>

      {drawerTaskId && (
        <TaskDetailsDrawer
          taskId={drawerTaskId}
          onClose={() => setDrawerTaskId(null)}
        />
      )}
    </>
  );
}
