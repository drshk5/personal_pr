import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartDescription,
  ChartTitle,
  ChartTooltipContent,
  ChartLegendContent,
  CHART_TOKENS,
} from "@/components/ui/chart";
import type { TopTaskEffortItemDto } from "@/types/task/charts";

export function TopTasksEffortPareto({
  data,
}: {
  data: TopTaskEffortItemDto[];
}) {
  const sorted = [...data].sort(
    (a, b) => b.intTotalMinutes - a.intTotalMinutes
  );
  const total = sorted.reduce((s, x) => s + x.intTotalMinutes, 0) || 1;
  let cum = 0;
  const items = sorted.map((x) => {
    cum += x.intTotalMinutes;
    return {
      ...x,
      cumulativePct: +((cum / total) * 100).toFixed(2),
      shortTitle:
        x.strTaskTitle.length > 18
          ? x.strTaskTitle.slice(0, 17) + "…"
          : x.strTaskTitle,
    };
  });

  return (
    <ChartContainer
      className="top-tasks-effort-chart"
      config={{
        minutes: { label: "Minutes", color: CHART_TOKENS[1] },
        cumulative: { label: "Cumulative %", color: CHART_TOKENS[3] },
      }}
    >
      <ChartTitle>Top Tasks by Effort (Pareto)</ChartTitle>
      <ChartDescription>
        Bars show minutes; line shows cumulative %
      </ChartDescription>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={items}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              strokeOpacity={0.3}
            />
            <XAxis
              dataKey="shortTitle"
              interval={0}
              angle={-30}
              textAnchor="end"
              height={60}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={
                <ChartTooltipContent
                  valueFormatter={(v, name) =>
                    name?.includes("%") ? `${v}%` : String(v)
                  }
                />
              }
            />
            <Legend content={<ChartLegendContent />} />
            <Bar
              yAxisId="left"
              dataKey="intTotalMinutes"
              name="Minutes"
              fill="var(--color-minutes)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativePct"
              name="Cumulative %"
              stroke="var(--color-cumulative)"
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
