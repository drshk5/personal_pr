import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LeadScoreFactorDto } from "@/types/CRM/lead";

interface LeadScoreBreakdownProps {
  score: number;
  breakdown?: LeadScoreFactorDto[];
}

const categoryLabels: Record<string, string> = {
  data_completeness: "Data Completeness",
  engagement: "Engagement",
  decay: "Time Decay",
  negative: "Negative Signals",
};

const categoryOrder = ["data_completeness", "engagement", "decay", "negative"];

function getCategoryIcon(category: string) {
  switch (category) {
    case "decay":
    case "negative":
      return TrendingDown;
    case "engagement":
      return TrendingUp;
    default:
      return Minus;
  }
}

function getScoreColor(score: number): string {
  if (score >= 76) return "text-emerald-600";
  if (score >= 51) return "text-blue-600";
  if (score >= 26) return "text-amber-600";
  return "text-red-600";
}

function getScoreBarColor(score: number): string {
  if (score >= 76) return "bg-emerald-500";
  if (score >= 51) return "bg-blue-500";
  if (score >= 26) return "bg-amber-500";
  return "bg-red-500";
}

const LeadScoreBreakdown: React.FC<LeadScoreBreakdownProps> = ({
  score,
  breakdown,
}) => {
  // Group factors by category
  const grouped = React.useMemo(() => {
    if (!breakdown || breakdown.length === 0) return {};
    const map: Record<string, LeadScoreFactorDto[]> = {};
    for (const factor of breakdown) {
      const cat = factor.strCategory || "other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(factor);
    }
    return map;
  }, [breakdown]);

  const sortedCategories = React.useMemo(() => {
    const cats = Object.keys(grouped);
    return cats.sort(
      (a, b) =>
        (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
        (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
    );
  }, [grouped]);

  return (
    <div className="rounded-lg border bg-card p-4">
      {/* Score header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold">Lead Score</h4>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all ${getScoreBarColor(score)}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>

      {/* Breakdown */}
      {breakdown && breakdown.length > 0 ? (
        <div className="space-y-3">
          {sortedCategories.map((category) => {
            const factors = grouped[category];
            const CategoryIcon = getCategoryIcon(category);
            const subtotal = factors.reduce((sum, f) => sum + f.intPoints, 0);

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {categoryLabels[category] || category}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      subtotal > 0
                        ? "text-emerald-600"
                        : subtotal < 0
                          ? "text-red-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {subtotal > 0 ? "+" : ""}
                    {subtotal}
                  </span>
                </div>
                <div className="ml-5 space-y-0.5">
                  {factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">
                        {factor.strFactor}
                      </span>
                      <span
                        className={
                          factor.intPoints > 0
                            ? "text-emerald-600"
                            : factor.intPoints < 0
                              ? "text-red-600"
                              : "text-muted-foreground"
                        }
                      >
                        {factor.intPoints > 0 ? "+" : ""}
                        {factor.intPoints}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          Score breakdown not available
        </p>
      )}
    </div>
  );
};

export default LeadScoreBreakdown;
