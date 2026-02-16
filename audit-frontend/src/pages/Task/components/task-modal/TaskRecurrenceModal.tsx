import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ModalDialog } from "@/components/ui/modal-dialog";
import type { TaskRecurrence } from "@/types/task/task";

interface TaskRecurrenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurrence: TaskRecurrence | null;
  onSave: (recurrence: TaskRecurrence) => void;
  startDate?: Date;
  dueDate?: Date;
}

function baseRecurrence(): TaskRecurrence {
  const now = new Date();
  const startDate = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  );

  return {
    strRecurrenceType: "Daily",
    intRecurrenceInterval: 1,
    strDaysOfWeek: null,
    intDayOfMonth: null,
    strWeekPattern: null,
    strWeekDay: null,
    intMonthOfYear: null,
    dtStartDate: startDate.toISOString(),
    dtEndDate: null,
    bolNoEndDate: true,
  };
}

export function TaskRecurrenceModal({
  open,
  onOpenChange,
  recurrence: initialRecurrence,
  onSave,
  startDate,
  dueDate,
}: TaskRecurrenceModalProps) {
  const [recurrenceTab, setRecurrenceTab] = useState<
    "Daily" | "Weekly" | "Monthly" | "Yearly"
  >("Daily");
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);
  const [weeklyDays, setWeeklyDays] = useState<string[]>([]);
  const [monthlyMode, setMonthlyMode] = useState<"day" | "pattern">("day");
  const [endNoLimit, setEndNoLimit] = useState(true);

  useEffect(() => {
    if (open) {
      if (initialRecurrence) {
        setRecurrenceTab(
          (initialRecurrence.strRecurrenceType as
            | "Daily"
            | "Weekly"
            | "Monthly"
            | "Yearly") || "Daily"
        );
        setRecurrence({ ...initialRecurrence });
        setWeeklyDays(initialRecurrence.strDaysOfWeek ?? []);
        const hasExplicitDay =
          typeof initialRecurrence.intDayOfMonth === "number" &&
          initialRecurrence.intDayOfMonth !== null;
        const hasPattern =
          !!initialRecurrence.strWeekPattern && !!initialRecurrence.strWeekDay;
        setMonthlyMode(hasExplicitDay ? "day" : hasPattern ? "pattern" : "day");
        setEndNoLimit(initialRecurrence.bolNoEndDate);
      } else {
        const base = baseRecurrence();
        setRecurrence(base);
        setRecurrenceTab("Daily");
        setWeeklyDays([]);
        setMonthlyMode("day");
        setEndNoLimit(true);
      }
    }
  }, [open, initialRecurrence]);

  const handleSave = () => {
    const base = baseRecurrence();
    const startDateWithMidnight = startDate || new Date();
    const startDateIso = new Date(
      Date.UTC(
        startDateWithMidnight.getFullYear(),
        startDateWithMidnight.getMonth(),
        startDateWithMidnight.getDate(),
        0,
        0,
        0,
        0
      )
    ).toISOString();

    const r: TaskRecurrence = {
      ...base,
      strRecurrenceType: recurrenceTab,
      intRecurrenceInterval: recurrence?.intRecurrenceInterval ?? 1,
      dtStartDate: startDateIso,
      strDaysOfWeek: recurrenceTab === "Weekly" ? weeklyDays : null,
      intDayOfMonth:
        recurrenceTab === "Monthly" && monthlyMode === "day"
          ? (recurrence?.intDayOfMonth ?? 1)
          : recurrenceTab === "Yearly"
            ? (recurrence?.intDayOfMonth ?? 1)
            : null,
      strWeekPattern:
        recurrenceTab === "Monthly" && monthlyMode === "pattern"
          ? (recurrence?.strWeekPattern ?? "First")
          : null,
      strWeekDay:
        recurrenceTab === "Monthly" && monthlyMode === "pattern"
          ? (recurrence?.strWeekDay ?? "Sunday")
          : null,
      intMonthOfYear:
        recurrenceTab === "Yearly"
          ? (recurrence?.intMonthOfYear ?? new Date().getMonth() + 1)
          : null,
      bolNoEndDate: recurrence?.bolNoEndDate ?? true,
      dtEndDate: recurrence?.dtEndDate
        ? new Date(
            Date.UTC(
              new Date(recurrence.dtEndDate).getFullYear(),
              new Date(recurrence.dtEndDate).getMonth(),
              new Date(recurrence.dtEndDate).getDate(),
              0,
              0,
              0,
              0
            )
          ).toISOString()
        : null,
    };

    onSave(r);
    onOpenChange(false);
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Repeat Task"
      description="Create new copies"
      maxWidth="560px"
      className="h-[490px]"
      showCloseButton={false}
      footerContent={
        <>
          <div />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Done
            </Button>
          </div>
        </>
      }
    >
      <div className="overflow-y-auto flex-1 space-y-4 pr-1 px-6 py-4">
        <div className="flex gap-2">
          {(["Daily", "Weekly", "Monthly", "Yearly"] as const).map((t) => (
            <Button
              key={t}
              type="button"
              variant={recurrenceTab === t ? "default" : "outline"}
              onClick={() => setRecurrenceTab(t)}
              className={`h-8 px-3 ${recurrenceTab === t ? "" : "bg-muted/40"}`}
            >
              {t}
            </Button>
          ))}
        </div>

        {recurrenceTab === "Daily" && (
          <div className="flex items-center gap-2">
            <Label className="w-auto">Every</Label>
            <Select
              value={(recurrence?.intRecurrenceInterval ?? 1).toString()}
              onValueChange={(val) =>
                setRecurrence((prev) => ({
                  ...(prev || baseRecurrence()),
                  intRecurrenceInterval: Number(val),
                }))
              }
            >
              <SelectTrigger className="h-8 w-20 px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 30 }).map((_, i) => (
                  <SelectItem
                    key={i + 1}
                    value={(i + 1).toString()}
                    className="pl-2 pr-2 [&_svg]:hidden"
                  >
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Day(s)
            </span>
          </div>
        )}

        {recurrenceTab === "Weekly" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-auto">Every</Label>
              <Select
                value={(recurrence?.intRecurrenceInterval ?? 1).toString()}
                onValueChange={(val) =>
                  setRecurrence((prev) => ({
                    ...(prev || baseRecurrence()),
                    intRecurrenceInterval: Number(val),
                  }))
                }
              >
                <SelectTrigger className="h-8 w-20 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <SelectItem
                      key={i + 1}
                      value={(i + 1).toString()}
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Week(s)
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="whitespace-nowrap mr-2">On</Label>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={weeklyDays.includes(d) ? "default" : "outline"}
                  onClick={() => {
                    setWeeklyDays((prev) =>
                      prev.includes(d)
                        ? prev.filter((x) => x !== d)
                        : [...prev, d]
                    );
                  }}
                  className={`h-8 ${
                    weeklyDays.includes(d) ? "" : "bg-muted/40"
                  }`}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>
        )}

        {recurrenceTab === "Monthly" && (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                monthlyMode === "day" ? "bg-muted/30" : "bg-background/40"
              }`}
            >
              <input
                type="radio"
                name="monthlyMode"
                checked={monthlyMode === "day"}
                onChange={() => setMonthlyMode("day")}
              />
              <span className="text-sm whitespace-nowrap">Once in every</span>
              <Select
                value={(recurrence?.intRecurrenceInterval ?? 1).toString()}
                onValueChange={(val) =>
                  setRecurrence((prev) => ({
                    ...(prev || baseRecurrence()),
                    intRecurrenceInterval: Number(val),
                  }))
                }
              >
                <SelectTrigger
                  className={`h-8 w-20 px-2 ${
                    monthlyMode !== "day"
                      ? "pointer-events-none opacity-60"
                      : ""
                  }`}
                  disabled={monthlyMode !== "day"}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <SelectItem
                      key={i + 1}
                      value={(i + 1).toString()}
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm whitespace-nowrap">Month(s) on</span>
              <Select
                value={(recurrence?.intDayOfMonth ?? 1).toString()}
                onValueChange={(val) =>
                  setRecurrence((prev) => ({
                    ...(prev || baseRecurrence()),
                    intDayOfMonth: Number(val),
                    strWeekPattern: null,
                    strWeekDay: null,
                  }))
                }
              >
                <SelectTrigger
                  className={`h-8 w-24 px-2 ${
                    monthlyMode !== "day"
                      ? "pointer-events-none opacity-60"
                      : ""
                  }`}
                  disabled={monthlyMode !== "day"}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }).map((_, i) => (
                    <SelectItem
                      key={i + 1}
                      value={(i + 1).toString()}
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                monthlyMode === "pattern" ? "bg-muted/30" : "bg-background/40"
              }`}
            >
              <input
                type="radio"
                name="monthlyMode"
                checked={monthlyMode === "pattern"}
                onChange={() => setMonthlyMode("pattern")}
              />
              <span className="text-sm whitespace-nowrap">Once in every</span>
              <Select
                value={(recurrence?.intRecurrenceInterval ?? 1).toString()}
                onValueChange={(val) =>
                  setRecurrence((prev) => ({
                    ...(prev || baseRecurrence()),
                    intRecurrenceInterval: Number(val),
                  }))
                }
              >
                <SelectTrigger
                  className={`h-8 w-20 px-2 ${
                    monthlyMode !== "pattern"
                      ? "pointer-events-none opacity-60"
                      : ""
                  }`}
                  disabled={monthlyMode !== "pattern"}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <SelectItem
                      key={i + 1}
                      value={(i + 1).toString()}
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm whitespace-nowrap">Month(s) on</span>
              <Select
                onValueChange={(val) =>
                  setRecurrence((prev) => ({
                    ...(prev || baseRecurrence()),
                    strWeekPattern: val as TaskRecurrence["strWeekPattern"],
                    intDayOfMonth: null,
                  }))
                }
              >
                <SelectTrigger
                  className={`h-8 w-28 px-2 ${
                    monthlyMode !== "pattern"
                      ? "pointer-events-none opacity-60"
                      : ""
                  }`}
                  disabled={monthlyMode !== "pattern"}
                >
                  <SelectValue placeholder="First" />
                </SelectTrigger>
                <SelectContent>
                  {["First", "Second", "Third", "Fourth", "Fifth", "Last"].map(
                    (p) => (
                      <SelectItem
                        key={p}
                        value={p}
                        className="pl-2 pr-2 [&_svg]:hidden"
                      >
                        {p}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Select
                onValueChange={(val) =>
                  setRecurrence((prev) => ({
                    ...(prev || baseRecurrence()),
                    strWeekDay: val,
                    intDayOfMonth: null,
                  }))
                }
              >
                <SelectTrigger
                  className={`h-8 w-36 px-2 ${
                    monthlyMode !== "pattern"
                      ? "pointer-events-none opacity-60"
                      : ""
                  }`}
                  disabled={monthlyMode !== "pattern"}
                >
                  <SelectValue placeholder="Sunday" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ].map((d) => (
                    <SelectItem
                      key={d}
                      value={d}
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {recurrenceTab === "Yearly" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">Once in every</span>
              <Select
                value={(recurrence?.intRecurrenceInterval ?? 1).toString()}
                onValueChange={(val) =>
                  setRecurrence((prev) => ({
                    ...(prev || baseRecurrence()),
                    intRecurrenceInterval: Number(val),
                  }))
                }
              >
                <SelectTrigger className="h-8 w-20 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <SelectItem
                      key={i + 1}
                      value={(i + 1).toString()}
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm whitespace-nowrap">Year(s) on</span>
              <Select
                value={(
                  recurrence?.intMonthOfYear ?? new Date().getMonth() + 1
                ).toString()}
                onValueChange={(val) =>
                  setRecurrence((prev) => ({
                    ...(prev || baseRecurrence()),
                    intMonthOfYear: Number(val),
                  }))
                }
              >
                <SelectTrigger className="h-8 w-40 px-2">
                  <SelectValue placeholder="January" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((m, idx) => (
                    <SelectItem
                      key={m}
                      value={(idx + 1).toString()}
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={(recurrence?.intDayOfMonth ?? 1).toString()}
                onValueChange={(val) =>
                  setRecurrence((prev) => ({
                    ...(prev || baseRecurrence()),
                    intDayOfMonth: Number(val),
                    strWeekPattern: null,
                    strWeekDay: null,
                  }))
                }
              >
                <SelectTrigger className="h-8 w-24 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }).map((_, i) => (
                    <SelectItem
                      key={i + 1}
                      value={(i + 1).toString()}
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="pt-1">
            When do you want to stop repeating this Task?
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="end"
              checked={endNoLimit}
              onChange={() => {
                setEndNoLimit(true);
                setRecurrence((prev) => ({
                  ...(prev || baseRecurrence()),
                  bolNoEndDate: true,
                  dtEndDate: null,
                }));
              }}
            />
            <span className="whitespace-nowrap py-3">
              Do not stop repeating this Task
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="end"
              checked={!endNoLimit}
              onChange={() => {
                setEndNoLimit(false);
                setRecurrence((prev) => ({
                  ...(prev || baseRecurrence()),
                  bolNoEndDate: false,
                }));
              }}
            />
            <div
              className={`${
                endNoLimit ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <DatePicker
                value={
                  recurrence?.dtEndDate
                    ? new Date(recurrence.dtEndDate)
                    : undefined
                }
                disabled={(d) => {
                  // Block picking dates before today
                  const today = new Date();
                  const todayMidnight = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                    0,
                    0,
                    0,
                    0
                  );
                  const candidate = new Date(
                    d.getFullYear(),
                    d.getMonth(),
                    d.getDate(),
                    0,
                    0,
                    0,
                    0
                  );
                  return candidate < todayMidnight;
                }}
                onChange={(d) => {
                  if (d) {
                    const base = dueDate ?? startDate ?? new Date();
                    const startMidnight = new Date(
                      base.getFullYear(),
                      base.getMonth(),
                      base.getDate(),
                      0,
                      0,
                      0,
                      0
                    );
                    const chosen = new Date(
                      d.getFullYear(),
                      d.getMonth(),
                      d.getDate(),
                      0,
                      0,
                      0,
                      0
                    );
                    if (chosen < startMidnight) {
                      toast.error(
                        "Task Start time should not exceed End time."
                      );
                      return;
                    }
                  }
                  setRecurrence((prev) => ({
                    ...(prev || baseRecurrence()),
                    dtEndDate: d
                      ? new Date(
                          Date.UTC(
                            d.getFullYear(),
                            d.getMonth(),
                            d.getDate(),
                            0,
                            0,
                            0,
                            0
                          )
                        ).toISOString()
                      : null,
                  }));
                }}
                placeholder="Select end date"
              />
            </div>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
