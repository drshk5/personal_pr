import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
  ChartDescription,
  ChartTitle,
  ChartTooltipContent,
  CHART_TOKENS,
} from "@/components/ui/chart";
import type { UserCompletionStatsDto } from "@/types/task/charts";

export function UserCompletionStatsChart({
  data,
}: {
  data: UserCompletionStatsDto[];
}) {
  const items = [...data]
    .sort((a, b) => b.intCompletedTasks - a.intCompletedTasks)
    .slice(0, 15);

  if (!items.length) {
    return (
      <ChartContainer
        config={{
          tasks: { label: "Completed Tasks", color: CHART_TOKENS[3] },
        }}
      >
        <ChartTitle>User Completion Statistics</ChartTitle>
        <ChartDescription>User task completion count</ChartDescription>
        <div className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No completion data available</p>
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer
      className="user-completion-stats-chart"
      config={{
        tasks: { label: "Completed Tasks", color: CHART_TOKENS[3] },
      }}
    >
      <ChartTitle>User Completion Statistics</ChartTitle>
      <ChartDescription>User task completion count</ChartDescription>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} margin={{ left: 8, right: 16, bottom: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              strokeOpacity={0.3}
            />
            <XAxis
              dataKey="strUserName"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              interval={0}
              tickMargin={8}
              height={36}
              tickFormatter={(v: string) =>
                v?.length > 16 ? v.slice(0, 15) + "…" : v
              }
            />
            <YAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0].payload as UserCompletionStatsDto;
                return (
                  <ChartTooltipContent
                    active={active}
                    payload={[
                      {
                        color: "var(--color-tasks)",
                        name: "Completed Tasks",
                        value: row.intCompletedTasks,
                        dataKey: "intCompletedTasks",
                      },
                    ]}
                    label={row.strUserName}
                  />
                );
              }}
            />
            <Bar
              dataKey="intCompletedTasks"
              fill="var(--color-tasks)"
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey="intCompletedTasks"
                position="top"
                formatter={(v) =>
                  typeof v === "number" ? v.toLocaleString() : String(v)
                }
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
