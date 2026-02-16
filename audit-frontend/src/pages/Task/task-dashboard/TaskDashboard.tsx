import { useState, useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  Pause,
  AlertCircle,
  LayoutDashboard,
  Play,
  XCircle,
  RefreshCw,
} from "lucide-react";

import {
  useUserStatus,
  useBoardStatus,
} from "@/hooks/api/task/use-task-dashboard";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useBoardsByUser } from "@/hooks/api/task/use-board-team";

import { TaskCounterCard } from "@/pages/Task/components/cards/TaskCounterCard";
import CustomContainer from "@/components/layout/custom-container";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { UserStatusTab } from "@/pages/Task/task-dashboard/UserStatusTab";
import {
  useUserLeaderboard,
  useWorkloadHeatmap,
  useRateCoverage,
  useTaskAging,
  useTopTasksEffort,
  useUserCompletionStats,
} from "@/hooks/api/task";
import { UserLeaderboardChart } from "@/pages/Task/task-dashboard/charts/UserLeaderboardChart";
import { WorkloadHeatmap } from "@/pages/Task/task-dashboard/charts/WorkloadHeatmap";
import { RateCoverageChart } from "@/pages/Task/task-dashboard/charts/RateCoverageChart";
import { TaskAgingChart } from "@/pages/Task/task-dashboard/charts/TaskAgingChart";
import { TopTasksEffortPareto } from "@/pages/Task/task-dashboard/charts/TopTasksEffortPareto";
import { UserCompletionStatsChart } from "@/pages/Task/task-dashboard/charts/UserCompletionStatsChart";

interface TaskDashboardProps {
  className?: string;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<"statistics" | "usertimeline">(
    "statistics"
  );
  const [userFilter, setUserFilter] = useState<
    "all" | "active" | "idle" | "overdue"
  >("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [designationFilter, setDesignationFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedBoardGUID, setSelectedBoardGUID] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [boardDropdownOpened, setBoardDropdownOpened] = useState(false);

  const { user } = useAuthContext();
  const userBoards = useBoardsByUser(user?.strUserGUID, boardDropdownOpened);

  const boardStatus = useBoardStatus(
    {
      strBoardGUID: selectedBoardGUID,
    },
    activeTab === "statistics"
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await userBoards.refetch();
      if (activeTab === "statistics") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const promises: Promise<any>[] = [userStatus.refetch()];
        if (selectedBoardGUID) {
          promises.push(
            boardStatus.refetch(),
            userLeaderboard.refetch(),
            workloadHeatmap.refetch(),
            rateCoverage.refetch(),
            taskAging.refetch(),
            topTasksEffort.refetch(),
            userCompletionStats.refetch()
          );
        }
        await Promise.all(promises);
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const userStatusParams = useMemo(() => {
    if (!selectedBoardGUID || !user?.strUserGUID) {
      return null;
    }

    const params: {
      strBoardGUID: string;
      strUserGUID: string;
      strUserStatus?: "Active" | "Idle";
      strPriority?: string;
      strDepartmentGUID?: string;
      strDesignationGUID?: string;
    } = {
      strBoardGUID: selectedBoardGUID,
      strUserGUID: user.strUserGUID,
    };

    if (userFilter === "active") {
      params.strUserStatus = "Active";
    } else if (userFilter === "idle") {
      params.strUserStatus = "Idle";
    }

    if (departmentFilter !== "all") {
      params.strDepartmentGUID = departmentFilter;
    }

    if (designationFilter !== "all") {
      params.strDesignationGUID = designationFilter;
    }

    if (priorityFilter !== "all") {
      params.strPriority = priorityFilter;
    }

    return params;
  }, [
    selectedBoardGUID,
    user?.strUserGUID,
    userFilter,
    departmentFilter,
    designationFilter,
    priorityFilter,
  ]);

  const userStatus = useUserStatus(
    userStatusParams!,
    activeTab === "usertimeline" && !!userStatusParams
  );

  const isUserStatus400Error = useMemo(() => {
    if (!userStatus.error) return false;
    const err = userStatus.error as unknown as {
      response?: { status?: number };
    };
    return err?.response?.status === 400;
  }, [userStatus.error]);

  const chartParams = useMemo(() => {
    if (!selectedBoardGUID) return null;
    return {
      strBoardGUID: selectedBoardGUID,
    };
  }, [selectedBoardGUID]);

  const userLeaderboard = useUserLeaderboard(
    chartParams ?? undefined,
    activeTab === "statistics" && !!chartParams
  );
  const workloadHeatmap = useWorkloadHeatmap(
    chartParams ?? undefined,
    activeTab === "statistics" && !!chartParams
  );
  const rateCoverage = useRateCoverage(
    chartParams ?? undefined,
    activeTab === "statistics" && !!chartParams
  );
  const taskAging = useTaskAging(
    chartParams ?? undefined,
    activeTab === "statistics" && !!chartParams
  );
  const topTasksEffort = useTopTasksEffort(
    chartParams ?? undefined,
    12,
    activeTab === "statistics" && !!chartParams
  );
  const userCompletionStats = useUserCompletionStats(
    chartParams ?? undefined,
    activeTab === "statistics" && !!chartParams
  );

  return (
    <CustomContainer>
      <div className="min-h-screen bg-linear-to-br from-background to-muted/1">
        <div className="space-y-8 w-full">
          <div className="space-y-4">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Task Dashboard
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                  Monitor your task statistics at a glance
                </p>
              </div>

              <div className="flex items-center gap-2">
                <PreloadedSelect
                  options={
                    userBoards.data?.boards?.map((board) => ({
                      value: board.strBoardGUID,
                      label: board.strBoardName || "Unknown project",
                    })) || []
                  }
                  selectedValue={selectedBoardGUID}
                  onChange={setSelectedBoardGUID}
                  onOpenChange={setBoardDropdownOpened}
                  placeholder="Select a project"
                  isLoading={userBoards.isLoading}
                  clearable={true}
                  className="border border-border-color w-full sm:w-62.5"
                />
                {selectedBoardGUID && (
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 rounded-md border border-border-color text-foreground bg-background hover:bg-accent transition-colors shrink-0 disabled:opacity-50 "
                    title="Refresh data"
                  >
                    <RefreshCw
                      className={`h-4 w-4 transition-transform ${isRefreshing ? "animate-spin" : ""}`}
                    />
                  </button>
                )}
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "statistics" | "usertimeline")
              }
              className="w-56"
            >
              <TabsList className="w-full justify-start rounded-none bg-transparent h-auto p-0 border-b border-border-color max-w-md">
                <TabsTrigger
                  value="statistics"
                  className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Statistics
                </TabsTrigger>
                <TabsTrigger
                  value="usertimeline"
                  className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  User Status
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-secondary/5 rounded-full blur-3xl"></div>
            </div>

            {activeTab === "statistics" && (
              <div className={`space-y-8 ${className}`}>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Project Status
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        View task status distribution by project
                      </p>
                    </div>
                  </div>

                  {selectedBoardGUID ? (
                    boardStatus.isLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                          <Card key={i} className="p-4">
                            <div className="space-y-3">
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-10 w-20" />
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : boardStatus.error ? (
                      <Card className="p-6 border-destructive/50 bg-destructive/5">
                        <div className="flex items-start gap-3 text-destructive">
                          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              Unable to load project status
                            </p>
                            <p className="text-sm mt-1 opacity-90">
                              {boardStatus.error instanceof Error
                                ? boardStatus.error.message
                                : "An error occurred while fetching project status data. Please try again later."}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ) : boardStatus.data && boardStatus.data.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
                        {boardStatus.data.map((statusCount, index) => (
                          <div
                            key={statusCount.strStatus}
                            className="animate-in duration-500 h-full"
                            style={{ animationDelay: `${index * 75}ms` }}
                          >
                            <TaskCounterCard
                              title={statusCount.strStatus}
                              value={statusCount.intCount}
                              icon={
                                statusCount.strStatus === "Completed" ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : statusCount.strStatus === "Started" ? (
                                  <Play className="h-5 w-5" />
                                ) : statusCount.strStatus === "On-Hold" ? (
                                  <Pause className="h-5 w-5" />
                                ) : statusCount.strStatus === "Not Started" ? (
                                  <Clock className="h-5 w-5" />
                                ) : statusCount.strStatus === "InComplete" ? (
                                  <XCircle className="h-5 w-5" />
                                ) : (
                                  <AlertCircle className="h-5 w-5" />
                                )
                              }
                              isLoading={false}
                              error={false}
                              onClick={() => {
                                const baseUrl = window.location.origin;
                                const params = new URLSearchParams();
                                params.set("status", statusCount.strStatus);
                                if (selectedBoardGUID) {
                                  params.set("board", selectedBoardGUID);
                                }
                                const statusUrl = `${baseUrl}/all-tasks?${params.toString()}`;
                                window.open(statusUrl, "_blank");
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Card className="p-8">
                        <div className="text-center text-muted-foreground">
                          <LayoutDashboard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-lg font-medium">
                            No tasks in this project
                          </p>
                          <p className="text-sm mt-1">
                            This project doesn't have any tasks yet
                          </p>
                        </div>
                      </Card>
                    )
                  ) : (
                    <Card className="p-8">
                      <div className="text-center text-muted-foreground">
                        <LayoutDashboard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">Select a project</p>
                        <p className="text-sm mt-1">
                          Choose a project from the dropdown to view its status
                          distribution
                        </p>
                      </div>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Insights
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Visual analytics for your selected project
                      </p>
                    </div>
                  </div>

                  {!selectedBoardGUID ? (
                    <Card className="p-8">
                      <div className="text-center text-muted-foreground">
                        <LayoutDashboard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">Select a project</p>
                        <p className="text-sm mt-1">
                          Choose a project to load charts
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                      <div>
                        {userLeaderboard.isLoading ? (
                          <Card className="p-6">
                            <Skeleton className="h-80 w-full" />
                          </Card>
                        ) : userLeaderboard.data ? (
                          <UserLeaderboardChart data={userLeaderboard.data} />
                        ) : null}
                      </div>
                      <div>
                        {workloadHeatmap.isLoading ? (
                          <Card className="p-6">
                            <Skeleton className="h-80 w-full" />
                          </Card>
                        ) : workloadHeatmap.data ? (
                          <WorkloadHeatmap data={workloadHeatmap.data} />
                        ) : null}
                      </div>
                      <div>
                        {rateCoverage.isLoading ? (
                          <Card className="p-6">
                            <Skeleton className="h-72 w-full" />
                          </Card>
                        ) : rateCoverage.data ? (
                          <RateCoverageChart data={rateCoverage.data} />
                        ) : null}
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        {taskAging.isLoading ? (
                          <Card className="p-6">
                            <Skeleton className="h-64 w-full" />
                          </Card>
                        ) : taskAging.data ? (
                          <TaskAgingChart data={taskAging.data} />
                        ) : null}
                        {topTasksEffort.isLoading ? (
                          <Card className="p-6">
                            <Skeleton className="h-72 w-full" />
                          </Card>
                        ) : topTasksEffort.data ? (
                          <TopTasksEffortPareto data={topTasksEffort.data} />
                        ) : null}
                        {userCompletionStats.isLoading ? (
                          <Card className="p-6">
                            <Skeleton className="h-72 w-full" />
                          </Card>
                        ) : userCompletionStats.data ? (
                          <UserCompletionStatsChart
                            data={userCompletionStats.data}
                          />
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "usertimeline" && (
              <div className={`space-y-8 ${className}`}>
                <UserStatusTab
                  data={userStatus.data}
                  isLoading={userStatus.isLoading}
                  error={userStatus.error}
                  userFilter={userFilter}
                  setUserFilter={setUserFilter}
                  departmentFilter={departmentFilter}
                  setDepartmentFilter={setDepartmentFilter}
                  designationFilter={designationFilter}
                  setDesignationFilter={setDesignationFilter}
                  priorityFilter={priorityFilter}
                  setPriorityFilter={setPriorityFilter}
                  isUserStatus400Error={isUserStatus400Error}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomContainer>
  );
};

export default TaskDashboard;
