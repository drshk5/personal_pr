import React, { Suspense, lazy } from "react";
import { PageLoader } from "@/components/layout/page-loader";
import BoardSubModuleList from "@/pages/Task/board-sub-module/BoardSubModuleList";
import BoardSubModuleForm from "@/pages/Task/board-sub-module/BoardSubModuleForm";
import BoardModuleList from "@/pages/Task/board-module/BoardModuleList";
import BoardModuleForm from "@/pages/Task/board-module/BoardModuleForm";

const UserHourlyRateList = lazy(
  () => import("@/pages/Task/user-hourly-rate/UserHourlyRateList")
);
const UserHourlyRateForm = lazy(
  () => import("@/pages/Task/user-hourly-rate/UserHourlyRateForm")
);

const BoardList = lazy(() => import("@/pages/Task/board/BoardList"));
const BoardMasterList = lazy(
  () => import("@/pages/Task/board/BoardMasterList")
);
const BoardForm = lazy(() => import("@/pages/Task/board/BoardForm"));
const MyTask = lazy(() => import("@/pages/Task/mytask/MyTask"));
const AllTasks = lazy(() => import("@/pages/Task/alltasks/AllTasks"));
const AssignTask = lazy(() => import("@/pages/Task/assign-task/AssignTask"));
const TaskImport = lazy(() => import("@/pages/Task/task-import/TaskImport"));
const TaskDashboard = lazy(
  () => import("@/pages/Task/task-dashboard/TaskDashboard")
);
const TaskReports = lazy(() => import("@/pages/Task/task-reports/TaskReports"));
const DailyWorkSummaryReport = lazy(
  () => import("@/pages/Task/task-reports/DailyWorkSummaryReport")
);
const BillableSummaryReport = lazy(
  () => import("@/pages/Task/task-reports/BillableSummaryReport")
);
const BillableDetailReport = lazy(
  () => import("@/pages/Task/task-reports/BillableDetailReport")
);
const ProjectSummaryReport = lazy(
  () => import("@/pages/Task/task-reports/ProjectSummaryReport")
);
const ProjectDetailReport = lazy(
  () => import("@/pages/Task/task-reports/ProjectDetailReport")
);
const TicketWiseReport = lazy(
  () => import("@/pages/Task/task-reports/TicketWiseReport")
);
const UserTimelineReport = lazy(
  () => import("@/pages/Task/task-reports/UserTimelineReport")
);
const UserPerformanceReport = lazy(
  () => import("@/pages/Task/task-reports/UserPerformanceReport")
);
const TaskTimer = lazy(() => import("@/pages/Task/task-timer/TaskTimer"));
const ReviewTask = lazy(() => import("@/pages/Task/review-task/ReviewTask"));

const wrapWithSuspense = (
  Component: React.ComponentType
): React.ReactElement => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const getTaskRouteElement = (
  mapKey: string
): React.ReactElement | null => {
  const normalizedKey = mapKey.toLowerCase();

  switch (normalizedKey) {
    case "my_task":
      return wrapWithSuspense(MyTask);
    case "all_tasks":
      return wrapWithSuspense(AllTasks);
    case "assign_task":
      return wrapWithSuspense(AssignTask);
    case "task_import":
    case "import":
      return wrapWithSuspense(TaskImport);
    case "task_dashboard":
      return wrapWithSuspense(TaskDashboard);
    case "task_reports":
    case "reports":
      return wrapWithSuspense(TaskReports);
    case "daily_work_summary":
    case "daily-work-summary":
      return wrapWithSuspense(DailyWorkSummaryReport);
    case "billable_summary":
    case "billable-summary":
      return wrapWithSuspense(BillableSummaryReport);
    case "billable_detail":
    case "billable-detail":
      return wrapWithSuspense(BillableDetailReport);
    case "project_summary":
    case "project-summary":
      return wrapWithSuspense(ProjectSummaryReport);
    case "project_detail":
    case "project-detail":
      return wrapWithSuspense(ProjectDetailReport);
    case "ticket_wise_report":
    case "ticket-wise-report":
      return wrapWithSuspense(TicketWiseReport);
    case "user_timeline":
    case "user-timeline":
      return wrapWithSuspense(UserTimelineReport);
    case "user_performance":
    case "user-performance":
      return wrapWithSuspense(UserPerformanceReport);
    case "timeline":
      return wrapWithSuspense(TaskTimer);
    case "review_task":
      return wrapWithSuspense(ReviewTask);

    case "user_hourly_rate_list":
      return wrapWithSuspense(UserHourlyRateList);
    case "user_hourly_rate_form":
      return wrapWithSuspense(UserHourlyRateForm);

    case "board":
      return wrapWithSuspense(BoardMasterList);
    case "board_form":
      return wrapWithSuspense(BoardForm);

    case "sub_module":
      return wrapWithSuspense(BoardSubModuleList);
    case "sub_module_form":
      return wrapWithSuspense(BoardSubModuleForm);

    case "module":
      return wrapWithSuspense(BoardModuleList);
    case "module_form":
      return wrapWithSuspense(BoardModuleForm);

    case "kanban_task":
      return wrapWithSuspense(BoardList);
    default:
      return null;
  }
};
