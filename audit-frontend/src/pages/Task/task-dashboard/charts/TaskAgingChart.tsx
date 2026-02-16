import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import {
  ChartContainer,
  ChartDescription,
  ChartTitle,
  ChartTooltipContent,
  ChartLegendContent,
  CHART_TOKENS,
} from "@/components/ui/chart";
import type { TaskAgingItemDto } from "@/types/task/charts";

export function TaskAgingChart({ data }: { data: TaskAgingItemDto[] }) {
  const items = data?.length
    ? data
    : [
        {
          strBoardName: "Board",
          intOpen: 0,
          intOverdue: 0,
          strBoardGUID: "",
        } as TaskAgingItemDto,
      ];
  return (
    <ChartContainer
      className="task-aging-chart"
      config={{
        open: { label: "Open", color: CHART_TOKENS[2] },
        overdue: { label: "Overdue", color: CHART_TOKENS[5] },
      }}
    >
      <ChartTitle>Task Aging</ChartTitle>
      <ChartDescription>Open vs Overdue tasks</ChartDescription>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              strokeOpacity={0.3}
            />
            <XAxis dataKey="strBoardName" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={
                <ChartTooltipContent valueFormatter={(v) => String(v)} />
              }
            />
            <Legend content={<ChartLegendContent />} />
            <Bar
              dataKey="intOpen"
              name="Open"
              fill="var(--color-open)"
              radius={4}
            />
            <Bar
              dataKey="intOverdue"
              name="Overdue"
              fill="var(--color-overdue)"
              radius={4}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
