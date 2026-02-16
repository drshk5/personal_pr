import * as React from "react";
import { cn } from "@/lib/utils";

export type ChartConfig<TKeys extends string = string> = Record<
  TKeys,
  {
    label: string;
    color: string; // CSS color or var(--token)
  }
>;

export function ChartContainer<Keys extends string = string>({
  className,
  children,
  config,
}: React.PropsWithChildren<{
  className?: string;
  config?: ChartConfig<Keys>;
}>) {
  const style = React.useMemo(() => {
    const s: React.CSSProperties = {};
    if (config) {
      for (const key of Object.keys(config)) {
        // Expose series colors as CSS vars --color-{key}
        (s as any)[`--color-${key}`] = (config as any)[key].color;
      }
    }
    return s;
  }, [config]);

  return (
    <div
      style={style}
      className={cn(
        "rounded-lg bg-card text-card-foreground p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ChartTitle({ children }: React.PropsWithChildren) {
  return (
    <h3 className="text-sm font-medium text-foreground mb-1.5 tracking-tight">
      {children}
    </h3>
  );
}

export function ChartDescription({ children }: React.PropsWithChildren) {
  return <p className="text-xs text-muted-foreground mb-3">{children}</p>;
}

// Recharts tooltip helpers (shadcn-style)
export function ChartTooltipContent({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    name?: string;
    value?: number;
    dataKey?: string;
  }>;
  label?: string | number;
  valueFormatter?: (value: unknown, name?: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border-color bg-popover text-popover-foreground shadow-md px-3 py-2">
      {label !== undefined && (
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          {String(label)}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => {
          const color = p.color || "var(--foreground)";
          const name = p.name || String(p.dataKey || i);
          const val = valueFormatter
            ? valueFormatter(p.value, name)
            : String(p.value ?? "");
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-foreground/90">{name}</span>
              <span className="ml-auto tabular-nums text-foreground">
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartLegendContent({ payload }: any) {
  if (!payload || payload.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {payload.map((p: any) => (
        <div key={p.value} className="inline-flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// Convenience: chart series tokens
export const CHART_TOKENS = {
  1: "var(--chart-1)",
  2: "var(--chart-2)",
  3: "var(--chart-3)",
  4: "var(--chart-4)",
  5: "var(--chart-5)",
} as const;
