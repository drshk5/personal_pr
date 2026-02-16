/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from "recharts";
import {
  ChartContainer,
  ChartDescription,
  ChartTitle,
  ChartLegendContent,
  ChartTooltipContent,
  CHART_TOKENS,
} from "@/components/ui/chart";
import type { RateCoverageItemDto } from "@/types/task/charts";

function formatDateLabel(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

export function RateCoverageChart({ data }: { data: RateCoverageItemDto[] }) {
  const items = [...data].sort(
    (a, b) =>
      new Date(a.dtTaskDate).getTime() - new Date(b.dtTaskDate).getTime()
  );
  const [legendValues, setLegendValues] = React.useState<{
    with?: number;
    without?: number;
  } | null>(null);
  return (
    <ChartContainer
      className="rate-coverage-chart"
      config={{
        with: { label: "With Rate", color: CHART_TOKENS[1] },
        without: { label: "Without Rate", color: CHART_TOKENS[5] },
      }}
    >
      <ChartTitle>Rate Coverage</ChartTitle>
      <ChartDescription>
        Tasks with rate vs without rate per day
      </ChartDescription>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={items}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            onMouseMove={(state: any) => {
              const payload = state?.activePayload as any[] | undefined;
              if (payload && payload.length) {
                const next = {
                  with: undefined as number | undefined,
                  without: undefined as number | undefined,
                };
                for (const p of payload) {
                  const key = String(p?.dataKey);
                  if (key === "intTasksWithRate")
                    next.with = Number(p?.value ?? 0);
                  if (key === "intTasksWithoutRate")
                    next.without = Number(p?.value ?? 0);
                }
                setLegendValues(next);
              }
            }}
            onMouseLeave={() => setLegendValues(null)}
          >
            <defs>
              <linearGradient id="rc-fill-with" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-with)"
                  stopOpacity={0.7}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-with)"
                  stopOpacity={0.2}
                />
              </linearGradient>
              <linearGradient id="rc-fill-without" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-without)"
                  stopOpacity={0.7}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-without)"
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              strokeOpacity={0.25}
            />
            <XAxis
              dataKey="dtTaskDate"
              tickFormatter={formatDateLabel}
              tickLine={false}
              axisLine={false}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              content={(props) => (
                <ChartTooltipContent
                  active={props.active}
                  payload={props.payload ? [...props.payload] : undefined}
                  label={formatDateLabel(String(props.label ?? ""))}
                  valueFormatter={(v) =>
                    `${typeof v === "number" ? Math.round(v as number) : v}`
                  }
                />
              )}
            />
            {/* Legend rendered outside Recharts for reliable re-renders */}
            <Area
              type="monotone"
              dataKey="intTasksWithRate"
              name="With Rate"
              stroke="var(--color-with)"
              fill="url(#rc-fill-with)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="intTasksWithoutRate"
              name="Without Rate"
              stroke="var(--color-without)"
              fill="url(#rc-fill-without)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Custom legend (shows values while hovering) */}
      {(() => {
        const base = [
          {
            value: "With Rate",
            color: "var(--color-with)",
            dataKey: "intTasksWithRate",
          },
          {
            value: "Without Rate",
            color: "var(--color-without)",
            dataKey: "intTasksWithoutRate",
          },
        ];
        const payload = base.map((p) => {
          const val = legendValues
            ? p.dataKey === "intTasksWithRate"
              ? legendValues.with
              : legendValues.without
            : undefined;
          return {
            ...p,
            value: `${p.value}${val !== undefined ? `: ${val}` : ""}`,
          } as any;
        });
        return (
          <div className="mt-2">
            <ChartLegendContent payload={payload} />
          </div>
        );
      })()}
    </ChartContainer>
  );
}
