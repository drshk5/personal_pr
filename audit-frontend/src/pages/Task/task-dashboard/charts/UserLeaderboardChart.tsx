/* eslint-disable @typescript-eslint/no-explicit-any */
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
import type { LeaderboardItemDto } from "@/types/task/charts";

export function UserLeaderboardChart({ data }: { data: LeaderboardItemDto[] }) {
  const items = [...data]
    .filter((x) => (x.decBillableAmountInBaseCurrency ?? 0) > 0)
    .sort(
      (a, b) =>
        b.decBillableAmountInBaseCurrency - a.decBillableAmountInBaseCurrency
    )
    .slice(0, 15);
  const baseCurrency = items[0]?.strBaseCurrencyCode || "";

  return (
    <ChartContainer
      className="user-leaderboard-chart"
      config={{
        amountBase: {
          label: `Amount (${baseCurrency || "Base"})`,
          color: CHART_TOKENS[1],
        },
        amountRate: { label: "Amount (Rate)", color: CHART_TOKENS[2] },
        tasks: { label: "Tasks", color: CHART_TOKENS[5] },
      }}
    >
      <ChartTitle>User Leaderboard</ChartTitle>
      <ChartDescription>
        Top users by billable amount (base currency)
      </ChartDescription>
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
                const row = payload[0].payload as LeaderboardItemDto;
                const list = [
                  {
                    color: "var(--color-amountBase)",
                    name: `Amount (${row.strBaseCurrencyCode})`,
                    value: row.decBillableAmountInBaseCurrency,
                  },
                  {
                    color: "var(--color-amountRate)",
                    name: `Amount (${row.strRateCurrencyCode})`,
                    value: row.decBillableAmountInRateCurrency,
                  },
                  {
                    color: "var(--color-tasks)",
                    name: "Tasks",
                    value: row.intBillableTasks,
                  },
                ];
                return (
                  <ChartTooltipContent
                    active
                    label={row.strUserName}
                    payload={list as any}
                    valueFormatter={(v) =>
                      typeof v === "number" ? v.toLocaleString() : String(v)
                    }
                  />
                );
              }}
            />
            <Bar
              dataKey="decBillableAmountInBaseCurrency"
              name={`Amount (${baseCurrency || "Base"})`}
              radius={[4, 4, 0, 0]}
              fill="var(--color-amountBase)"
            >
              <LabelList
                dataKey="decBillableAmountInBaseCurrency"
                position="top"
                formatter={(v) =>
                  typeof v === "number" ? v.toLocaleString() : String(v)
                }
                className="fill-foreground text-xs"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
