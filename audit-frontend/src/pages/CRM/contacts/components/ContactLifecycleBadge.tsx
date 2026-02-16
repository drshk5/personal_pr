import React from "react";

interface ContactLifecycleBadgeProps {
  stage: string;
}

const stageConfig: Record<string, { label: string; className: string }> = {
  Subscriber: {
    label: "Subscriber",
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300",
  },
  Lead: {
    label: "Lead",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  MQL: {
    label: "MQL",
    className:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  SQL: {
    label: "SQL",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  Opportunity: {
    label: "Opportunity",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  Customer: {
    label: "Customer",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  Evangelist: {
    label: "Evangelist",
    className:
      "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  },
};

const ContactLifecycleBadge: React.FC<ContactLifecycleBadgeProps> = ({
  stage,
}) => {
  const config = stageConfig[stage] || {
    label: stage,
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

export default ContactLifecycleBadge;
