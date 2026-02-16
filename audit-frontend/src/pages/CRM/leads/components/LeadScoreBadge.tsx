import React from "react";

function getScoreConfig(score: number): { label: string; className: string } {
  if (score >= 76) {
    return {
      label: "Hot",
      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    };
  }
  if (score >= 51) {
    return {
      label: "Warm",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    };
  }
  if (score >= 26) {
    return {
      label: "Cool",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    };
  }
  return {
    label: "Cold",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };
}

interface LeadScoreBadgeProps {
  score: number;
}

const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({ score }) => {
  const config = getScoreConfig(score);

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${config.className}`}
      >
        {score}
      </span>
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
};

export default LeadScoreBadge;
