import React from "react";

interface AccountIndustryBadgeProps {
  industry: string;
}

const industryConfig: Record<string, { label: string; className: string }> = {
  Technology: {
    label: "Technology",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  Finance: {
    label: "Finance",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  Healthcare: {
    label: "Healthcare",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  Manufacturing: {
    label: "Manufacturing",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  Retail: {
    label: "Retail",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  Education: {
    label: "Education",
    className:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  "Real Estate": {
    label: "Real Estate",
    className:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  },
  Consulting: {
    label: "Consulting",
    className:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  Media: {
    label: "Media",
    className:
      "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  },
  Telecommunications: {
    label: "Telecom",
    className:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  },
  Energy: {
    label: "Energy",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  Transportation: {
    label: "Transport",
    className:
      "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-300",
  },
  Agriculture: {
    label: "Agriculture",
    className:
      "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  },
  Government: {
    label: "Government",
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300",
  },
  "Non-Profit": {
    label: "Non-Profit",
    className:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  },
};

const AccountIndustryBadge: React.FC<AccountIndustryBadgeProps> = ({
  industry,
}) => {
  const config = industryConfig[industry] || {
    label: industry,
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default AccountIndustryBadge;
