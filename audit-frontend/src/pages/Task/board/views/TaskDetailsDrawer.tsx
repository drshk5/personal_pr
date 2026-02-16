import { useEffect, useState, useCallback } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTask } from "@/hooks/api/task/use-task";
import type { Task } from "@/types/task/task";
import { formatDate } from "@/lib/utils";

interface TaskDetailsDrawerProps {
  taskId: string;
  onClose?: () => void;
}

export default function TaskDetailsDrawer({
  taskId,
  onClose,
}: TaskDetailsDrawerProps) {
  const { data, isLoading, error } = useTask(taskId);
  const [open, setOpen] = useState(true);

  const task = (data as Task) || null;
  const checklists = task?.strChecklists || [];

  const formatRecurrence = (
    t: Task | null
  ): { summary: string; details: string[] } => {
    if (!t || !t.recurrence) return { summary: "Not set yet", details: [] };
    const r = t.recurrence;
    const parts: string[] = [];
    const type = r.strRecurrenceType;
    const every = r.intRecurrenceInterval || 1;
    if (type === "Daily") {
      parts.push(`Every ${every} day${every > 1 ? "s" : ""}`);
    } else if (type === "Weekly") {
      const days = (r.strDaysOfWeek || []).join(", ");
      parts.push(
        `Every ${every} week${every > 1 ? "s" : ""} on ${days || "—"}`
      );
    } else if (type === "Monthly") {
      if (r.intDayOfMonth != null) {
        parts.push(
          `Every ${every} month${every > 1 ? "s" : ""} on day ${
            r.intDayOfMonth
          }`
        );
      } else if (r.strWeekPattern && r.strWeekDay) {
        parts.push(
          `Every ${every} month${every > 1 ? "s" : ""} on ${r.strWeekPattern} ${
            r.strWeekDay
          }`
        );
      }
    } else if (type === "Yearly") {
      if (r.intMonthOfYear && r.intDayOfMonth) {
        parts.push(`Every year on ${r.intMonthOfYear}/${r.intDayOfMonth}`);
      } else if (r.strWeekPattern && r.strWeekDay && r.intMonthOfYear) {
        parts.push(
          `${r.strWeekPattern} ${r.strWeekDay} of month ${r.intMonthOfYear}`
        );
      }
    }
    const details: string[] = [];
    details.push(`Starts: ${formatDate(r.dtStartDate)}`);
    if (r.bolNoEndDate) {
      details.push("Ends: No end date");
    } else {
      details.push(`Ends: ${r.dtEndDate ? formatDate(r.dtEndDate) : "—"}`);
    }
    return { summary: parts.join(" ") || type || "Not set yet", details };
  };

  const handleSheetClose = useCallback(() => {
    setOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSheetClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSheetClose]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        className="w-100 sm:w-135 flex flex-col h-full overflow-hidden"
        onCloseAutoFocus={() => handleSheetClose()}
      >
        <div className="flex items-center justify-between dark:bg-black text-white p-2 rounded-t-lg">
          <div className="text-base font-medium">Task Details</div>
        </div>

        {isLoading && (
          <div className="p-4 text-center">
            <p className="py-4 text-foreground">Loading task details...</p>
          </div>
        )}

        {(error || !task) && !isLoading && (
          <div className="p-4 text-center">
            <p className="py-4 text-destructive">Failed to load task details</p>
          </div>
        )}

        {task && (
          <div className="flex flex-col h-[calc(100%-60px)]">
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-foreground wrap-break-word">
                  {task.strTitle}
                </h2>
                {task.strDescription && (
                  <div
                    className="text-sm text-muted-foreground mt-2 max-w-none **:wrap-break-word [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:mb-2"
                    dangerouslySetInnerHTML={{ __html: task.strDescription }}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="font-medium text-foreground">
                    {task.strStatus || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Priority</div>
                  <div className="font-medium text-foreground">
                    {task.strPriority || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Start Date</div>
                  <div className="font-medium text-foreground">
                    {task.dtStartDate
                      ? formatDate(task.dtStartDate, true)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Due Date</div>
                  <div className="font-medium text-foreground">
                    {task.dtDueDate ? formatDate(task.dtDueDate, true) : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Reminder</div>
                  <div className="font-medium text-foreground">
                    {task.dtReminderDate
                      ? formatDate(task.dtReminderDate, true)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Estimated Time</div>
                  <div className="font-medium text-foreground">
                    {task.intEstimatedMinutes != null
                      ? `${Math.floor(task.intEstimatedMinutes / 60)}h ${
                          task.intEstimatedMinutes % 60
                        }m`
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Actual Time</div>
                  <div className="font-medium text-foreground">
                    {task.intActualMinutes != null
                      ? `${Math.floor(task.intActualMinutes / 60)}h ${
                          task.intActualMinutes % 60
                        }m`
                      : "-"}
                  </div>
                </div>
                <div className="col-span-2 mt-2">
                  <div className="text-muted-foreground">Repeat Task</div>
                  {(() => {
                    const r = formatRecurrence(task);
                    return (
                      <div className="font-medium text-foreground">
                        <div>{r.summary}</div>
                        {r.details.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                            {r.details.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {task.strTags && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">Tags</div>
                  <div className="text-sm font-medium text-foreground wrap-break-word">
                    {task.strTags}
                  </div>
                </div>
              )}

              <div className="mt-6 border-t border-border pt-4">
                <Tabs defaultValue="checklist" className="w-49">
                  <TabsList className="w-full justify-start rounded-none bg-transparent h-auto p-0 border-b border-border">
                    <TabsTrigger
                      value="checklist"
                      className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      Checklist
                    </TabsTrigger>
                    <TabsTrigger
                      value="review"
                      className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      Review
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="checklist" className="mt-4">
                    {isLoading ? (
                      <div className="text-sm text-foreground">
                        Loading checklists...
                      </div>
                    ) : checklists && checklists.length > 0 ? (
                      <ul className="space-y-2">
                        {checklists.map((c) => (
                          <li
                            key={c.strTaskChecklistGUID}
                            className="flex items-start gap-2"
                          >
                            <div
                              className={`mt-1 h-2 w-2 rounded-full ${
                                c.bolIsCompleted
                                  ? "bg-green-500"
                                  : "bg-muted-foreground"
                              }`}
                            ></div>
                            <div className="flex-1">
                              <div className="text-sm text-foreground wrap-break-word">
                                {c.strTitle}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {c.dtDueDate
                                  ? `Due: ${formatDate(c.dtDueDate, true)}`
                                  : ""}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No checklists
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="review" className="mt-4">
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">
                          Review Required
                        </div>
                        <div className="font-medium text-foreground">
                          {task.bolIsReviewReq ? "Yes" : "No"}
                        </div>
                      </div>
                      {task.bolIsReviewReq && (
                        <>
                          {task.strReviewedBy && (
                            <div>
                              <div className="text-muted-foreground">
                                Reviewed By
                              </div>
                              <div className="font-medium text-foreground">
                                {task.strReviewedBy}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="text-muted-foreground">
                              Completed Date
                            </div>
                            <div className="font-medium text-foreground">
                              {task.dtCompletedDate
                                ? formatDate(task.dtCompletedDate, true)
                                : "Not completed yet"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border p-4 mt-auto">
              <Button className="w-full" onClick={handleSheetClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
