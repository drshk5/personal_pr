import type { UseFormReturn } from "react-hook-form";
import { Repeat, X } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";

interface RecurrenceSettingsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  onToggleRecurrence: (show: boolean) => void;
}

const REPEAT_TYPES = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Yearly", label: "Yearly" },
  { value: "Custom", label: "Custom" },
];

const REPEAT_UNITS = [
  { value: "Day", label: "Day(s)" },
  { value: "Week", label: "Week(s)" },
  { value: "Month", label: "Month(s)" },
  { value: "Year", label: "Year(s)" },
];

const WEEKDAYS = [
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
];

export const RecurrenceSettings: React.FC<RecurrenceSettingsProps> = ({
  form,
  onToggleRecurrence,
}) => {
  const watchRepeatType = form.watch("recurrence.strRepeatType");
  const watchNeverExpires = form.watch("recurrence.bolNeverExpires");

  const handleRemoveRecurrence = () => {
    form.setValue("recurrence", null);
    onToggleRecurrence(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Repeat className="h-5 w-5" />
          Recurring Schedule
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleRemoveRecurrence}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="recurrence.strProfileName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Monthly Rent Payment"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recurrence.strRepeatType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repeat Type <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <PreloadedSelect
                    options={REPEAT_TYPES.map((type) => ({
                      value: type.value,
                      label: type.label,
                    }))}
                    selectedValue={field.value || "Daily"}
                    onChange={field.onChange}
                    placeholder="Select repeat type"
                    allowNone={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchRepeatType === "Custom" && (
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="recurrence.intRepeatEveryValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat Every<span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        {...field}
                        value={field.value || 1}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurrence.strRepeatEveryUnit"
                render={({ field }) => (
                  <FormItem className="mt-5">
                    <FormControl>
                      <PreloadedSelect
                        options={REPEAT_UNITS.map((unit) => ({
                          value: unit.value,
                          label: unit.label,
                        }))}
                        selectedValue={field.value || "Day"}
                        onChange={field.onChange}
                        placeholder="Unit"
                        allowNone={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {watchRepeatType === "Monthly" && (
            <FormField
              control={form.control}
              name="recurrence.intRepeatOnDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of Month (1-31)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={31}
                      step={1}
                      placeholder="e.g., 15"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchRepeatType === "Weekly" && (
            <FormField
              control={form.control}
              name="recurrence.strRepeatOnWeekday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weekday</FormLabel>
                  <FormControl>
                    <PreloadedSelect
                      options={WEEKDAYS.map((day) => ({
                        value: day.value,
                        label: day.label,
                      }))}
                      selectedValue={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select weekday"
                      allowNone={true}
                      noneLabel="Select weekday"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="recurrence.dStartDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => {
                      if (date) {
                        field.onChange(format(date, "yyyy-MM-dd"));
                      }
                    }}
                    disabled={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!watchNeverExpires && (
            <FormField
              control={form.control}
              name="recurrence.dEndDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => {
                        field.onChange(date ? format(date, "yyyy-MM-dd") : null);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="recurrence.bolNeverExpires"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <div className="flex flex-row items-center gap-4 h-10">
                  <FormLabel className="text-base mb-0 ">Never Expires</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          form.setValue("recurrence.dEndDate", null);
                        }
                      }}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
