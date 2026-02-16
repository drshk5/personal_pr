import * as React from "react";
import {
  ChartContainer,
  ChartDescription,
  ChartTitle,
} from "@/components/ui/chart";
import type { WorkloadHeatmapItemDto } from "@/types/task/charts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function opacityFor(minutes: number) {
  if (minutes <= 0) return 0.08;
  if (minutes < 30) return 0.2;
  if (minutes < 60) return 0.35;
  if (minutes < 120) return 0.55;
  return 0.75;
}

export function WorkloadHeatmap({ data }: { data: WorkloadHeatmapItemDto[] }) {
  const byUser = new Map<
    string,
    { name: string; entries: Record<string, number> }
  >();
  const datesSet = new Set<string>();
  data.forEach((d) => {
    const date = d.dtTaskDate.slice(0, 10);
    datesSet.add(date);
    const key = d.strUserGUID;
    if (!byUser.has(key)) byUser.set(key, { name: d.strUserName, entries: {} });
    byUser.get(key)!.entries[date] =
      (byUser.get(key)!.entries[date] || 0) + d.intTotalMinutes;
  });
  const dates = Array.from(datesSet).sort();
  const rows = Array.from(byUser.values());

  return (
    <ChartContainer>
      <ChartTitle>Workload Heatmap</ChartTitle>
      <ChartDescription>
        Calendar-style intensity by total minutes
      </ChartDescription>
      <div className="overflow-auto">
        <div className="min-w-[640px]">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `160px repeat(${dates.length}, 1fr)`,
            }}
          >
            <div></div>
            {dates.map((d) => (
              <div
                key={d}
                className="text-xs text-muted-foreground px-1 py-1 text-center whitespace-nowrap"
              >
                {new Date(d).toLocaleDateString(undefined, {
                  month: "short",
                  day: "2-digit",
                })}
              </div>
            ))}
            <TooltipProvider>
              {rows.map((row) => (
                <React.Fragment key={row.name}>
                  <div className="text-xs font-medium text-foreground px-2 py-1 sticky left-0 bg-card z-10">
                    {row.name}
                  </div>
                  {dates.map((d) => {
                    const mins = row.entries[d] || 0;
                    const style = {
                      backgroundColor: "var(--chart-1)",
                      opacity: opacityFor(mins),
                    } as React.CSSProperties;
                    return (
                      <Tooltip key={row.name + d}>
                        <TooltipTrigger asChild>
                          <div
                            className="h-6 w-full rounded-sm"
                            style={style}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div className="font-medium text-foreground">
                              {row.name}
                            </div>
                            <div className="text-muted-foreground">
                              {new Date(d).toLocaleDateString()}
                            </div>
                            <div className="mt-1">{mins} minutes</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </React.Fragment>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
}
