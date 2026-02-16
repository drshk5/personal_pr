import React from "react";
import {
  Globe,
  Users,
  Linkedin,
  Phone,
  Megaphone,
  Store,
  MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const sourceConfig: Record<
  string,
  { icon: LucideIcon; className: string }
> = {
  Website: {
    icon: Globe,
    className: "text-blue-600 dark:text-blue-400",
  },
  Referral: {
    icon: Users,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  LinkedIn: {
    icon: Linkedin,
    className: "text-sky-600 dark:text-sky-400",
  },
  ColdCall: {
    icon: Phone,
    className: "text-orange-600 dark:text-orange-400",
  },
  Advertisement: {
    icon: Megaphone,
    className: "text-purple-600 dark:text-purple-400",
  },
  TradeShow: {
    icon: Store,
    className: "text-pink-600 dark:text-pink-400",
  },
  Other: {
    icon: MoreHorizontal,
    className: "text-gray-600 dark:text-gray-400",
  },
};

interface LeadSourceBadgeProps {
  source: string;
}

const LeadSourceBadge: React.FC<LeadSourceBadgeProps> = ({ source }) => {
  const config = sourceConfig[source] || {
    icon: MoreHorizontal,
    className: "text-gray-600 dark:text-gray-400",
  };
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 ${config.className}`} />
      <span className="text-sm text-foreground">{source === "ColdCall" ? "Cold Call" : source === "TradeShow" ? "Trade Show" : source}</span>
    </div>
  );
};

export default LeadSourceBadge;
