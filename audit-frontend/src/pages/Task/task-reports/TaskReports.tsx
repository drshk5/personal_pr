import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Clock4,
  FileText,
  User,
  ListChecks,
  FileBarChart,
} from "lucide-react";
import { useMemo, useCallback, useState } from "react";

import type { MenuItem } from "@/types/central/user-rights";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { useMenuIcon, useUserRights } from "@/hooks/common";
import { SearchInput } from "@/components/shared/search-input";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Report = {
  strMapKey: string;
  name: string;
  path: string;
  category: string;
  description: string;
  icon: React.FC<{ className?: string }>;
};

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  daily_work_summary: Clock4,
  billable_summary: BarChart3,
  billable_detail: FileText,
  user_timeline: User,
  user_performance: ListChecks,
  project_summary: FileBarChart,
  project_detail: FileText,
  ticket_wise_report: ListChecks,
};

const categoryMap: Record<string, string> = {
  daily_work_summary: "Hours & Activity",
  billable_summary: "Billing",
  billable_detail: "Billing",
  user_timeline: "Activity",
  user_performance: "Performance",
  project_summary: "Project",
  project_detail: "Project",
  ticket_wise_report: "Task",
};

const descriptionMap: Record<string, string> = {
  daily_work_summary: "Hours and task totals by user per day",
  billable_summary: "Billable hours and amount per user on projects",
  billable_detail: "Per-day task-level billable breakdown",
  user_timeline: "View detailed task timeline and activity for users",
  user_performance: "Task activity, timers, and billable flags per user",
  project_summary: "High-level overview of project progress and metrics",
  project_detail: "Detailed breakdown of tasks, time, and billing by project",
  ticket_wise_report:
    "Task-wise details with assignee, status, hours, and cost",
};

const TaskReports: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const { menuItems } = useUserRights();

  const HeaderIcon = useMenuIcon("task_reports", FileBarChart);

  const allReports = useMemo<Report[]>(() => {
    const reportsMenu = menuItems.find((item) => item.strMapKey === "reports");
    if (!reportsMenu || !reportsMenu.children) return [];

    return reportsMenu.children.map((child: MenuItem) => ({
      strMapKey: child.strMapKey,
      name: child.strName?.trim() || "Untitled Report",
      path: child.strPath,
      category: categoryMap[child.strMapKey] || "General",
      description: descriptionMap[child.strMapKey] || child.strName || "",
      icon: iconMap[child.strMapKey] || FileBarChart,
    }));
  }, [menuItems]);

  const reports = useMemo(() => {
    if (!debouncedSearch) return allReports;

    const searchLower = debouncedSearch.toLowerCase();
    return allReports.filter(
      (report) =>
        report.name.toLowerCase().includes(searchLower) ||
        report.category.toLowerCase().includes(searchLower) ||
        report.description.toLowerCase().includes(searchLower)
    );
  }, [debouncedSearch, allReports]);

  const handleRowClick = useCallback(
    (report: Report) => {
      navigate(report.path);
    },
    [navigate]
  );

  const isLoading = false;

  return (
    <CustomContainer>
      <PageHeader
        title="Task Reports"
        description="Select a report to view detailed analytics and data"
        icon={HeaderIcon}
      />

      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <SearchInput
            placeholder="Search by report name, category..."
            onSearchChange={setDebouncedSearch}
            debounceDelay={500}
            className="max-w-full sm:max-w-md sm:flex-1"
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton
          columns={[
            { header: "Report Name", width: "400px" },
            { header: "Description", width: "360px" },
            { header: "Report Category", width: "180px" },
          ]}
          pageSize={5}
        />
      ) : (
        <div className="rounded-lg border border-border-color bg-card/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-50 text-muted-foreground rounded-tl-lg">
                  Report Name
                </TableHead>
                <TableHead className="w-90 text-muted-foreground">
                  Description
                </TableHead>
                <TableHead className="w-45 text-muted-foreground rounded-tr-lg">
                  Report Category
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center h-32 text-muted-foreground"
                  >
                    {debouncedSearch ? (
                      <>No reports found matching "{debouncedSearch}".</>
                    ) : (
                      <>No reports available.</>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow
                    key={report.path}
                    className="cursor-pointer group"
                    onClick={() => handleRowClick(report)}
                  >
                    <TableCell className="whitespace-normal rounded-l-lg group-hover:bg-muted dark:group-hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-muted text-muted-foreground">
                          {report.icon && <report.icon className="h-4 w-4" />}
                        </div>
                        <span className="text-base font-medium text-foreground">
                          {report.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal group-hover:bg-muted dark:group-hover:bg-muted/50">
                      <span className="text-base text-muted-foreground">
                        {report.description}
                      </span>
                    </TableCell>
                    <TableCell className="rounded-r-lg group-hover:bg-muted dark:group-hover:bg-muted/50">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-base text-foreground">
                        {report.category}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </CustomContainer>
  );
};

export default TaskReports;
