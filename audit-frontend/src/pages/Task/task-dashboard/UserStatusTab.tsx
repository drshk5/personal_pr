import { useMemo, useState } from "react";
import { AlertCircle, Users, Info } from "lucide-react";

import { useActiveDepartments } from "@/hooks/api/central/use-departments";
import { useActiveDesignations } from "@/hooks/api/central/use-designations";

import type { UserStatus } from "@/types/task/task-dashboard";

import { UserTaskCard } from "@/pages/Task/components/cards/UserTaskCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { PRIORITY_COLOR_CLASS } from "@/constants/Task/task";

interface UserStatusTabProps {
  data?: UserStatus[];
  isLoading?: boolean;
  error?: Error | null;
  userFilter: "all" | "active" | "idle" | "overdue";
  setUserFilter: (value: "all" | "active" | "idle" | "overdue") => void;
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
  designationFilter: string;
  setDesignationFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  isUserStatus400Error?: boolean;
}

export function UserStatusTab({
  data,
  isLoading = false,
  error = null,
  userFilter,
  setUserFilter,
  departmentFilter,
  setDepartmentFilter,
  designationFilter,
  setDesignationFilter,
  priorityFilter,
  setPriorityFilter,
  isUserStatus400Error = false,
}: UserStatusTabProps) {
  const [dropdownOpen, setDropdownOpen] = useState({
    department: false,
    designation: false,
  });

  const departments = useActiveDepartments(undefined, dropdownOpen.department);
  const designations = useActiveDesignations(undefined, dropdownOpen.designation);

  const filteredUsers = useMemo(() => {
    if (!data) return [];

    return data
      .filter((user: UserStatus) => {
        if (userFilter === "overdue") {
          const taskInfo = user.taskInfo;
          const hasTask = taskInfo !== null && taskInfo !== undefined;

          const isOverdue =
            taskInfo?.intEstimatedMinutes && taskInfo?.intActualMinutes
              ? taskInfo.intActualMinutes > taskInfo.intEstimatedMinutes
              : false;

          return hasTask && isOverdue;
        }

        return true;
      })
      .sort((a: UserStatus, b: UserStatus) => {
        const taskInfoA = a.taskInfo;
        const taskInfoB = b.taskInfo;

        const isOverdueA =
          taskInfoA?.intEstimatedMinutes && taskInfoA?.intActualMinutes
            ? taskInfoA.intActualMinutes > taskInfoA.intEstimatedMinutes
            : false;

        const isOverdueB =
          taskInfoB?.intEstimatedMinutes && taskInfoB?.intActualMinutes
            ? taskInfoB.intActualMinutes > taskInfoB.intEstimatedMinutes
            : false;

        if (isOverdueA && !isOverdueB) return -1;
        if (!isOverdueA && isOverdueB) return 1;

        if (a.strUserStatus === "Active" && b.strUserStatus !== "Active")
          return -1;
        if (a.strUserStatus !== "Active" && b.strUserStatus === "Active")
          return 1;

        return a.strUserName.localeCompare(b.strUserName);
      });
  }, [data, userFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            User Status
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time view of team members and their active tasks
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 items-start justify-between lg:flex-row lg:items-center lg:gap-4 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <Tabs
            value={userFilter}
            onValueChange={(value) =>
              setUserFilter(value as "all" | "active" | "idle" | "overdue")
            }
            className="w-full md:w-auto"
          >
            <TabsList className="w-full justify-start rounded-none bg-transparent h-auto p-0 border-b border-border-color md:w-auto">
              <TabsTrigger
                value="all"
                className="text-xs sm:text-sm whitespace-nowrap px-4 md:px-6 py-2 md:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="text-xs sm:text-sm whitespace-nowrap px-4 md:px-6 py-2 md:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="idle"
                className="text-xs sm:text-sm whitespace-nowrap px-4 md:px-6 py-2 md:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Idle
              </TabsTrigger>
              <TabsTrigger
                value="overdue"
                className="text-xs sm:text-sm whitespace-nowrap px-3 md:px-6 py-2 md:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <span className="hidden md:inline">Time Exceeded</span>
                <span className="md:hidden">Overdue</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative group hidden sm:block">
            <button className="p-1.5 rounded-full transition-colors">
              <Info className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="absolute left-0 top-full mt-2 w-72 p-4 bg-popover border border-border-color rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="space-y-3">
                <p className="font-semibold text-sm text-foreground">
                  Status Indicators:
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        Active
                      </p>
                      <p className="text-xs text-muted-foreground">
                        User is currently working on a task
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        Idle
                      </p>
                      <p className="text-xs text-muted-foreground">
                        User is Idle and not working on any task
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        Time Exceeded
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Task time exceeded estimated duration
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:flex gap-3 w-full lg:w-auto">
          <Select 
            value={departmentFilter} 
            onValueChange={setDepartmentFilter}
            open={dropdownOpen.department}
            onOpenChange={(open) => setDropdownOpen({...dropdownOpen, department: open})}
          >
            <SelectTrigger
              className="w-full lg:w-45 border-border min-w-0 max-w-full"
              title={
                departmentFilter === "all"
                  ? "All Departments"
                  : departments.data?.find(
                      (d) => d.strDepartmentGUID === departmentFilter
                    )?.strDepartmentName
              }
              disabled={departments.isLoading}
            >
              <div className="truncate flex-1 text-left">
                {departments.isLoading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  <SelectValue placeholder="Filter by department" />
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              {departments.isLoading ? (
                <div className="space-y-2 p-2 w-full">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-sm" />
                  ))}
                </div>
              ) : (
                <>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.data?.map((dept) => (
                    <SelectItem
                      key={dept.strDepartmentGUID}
                      value={dept.strDepartmentGUID}
                      title={dept.strDepartmentName}
                    >
                      <span className="truncate block">
                        {dept.strDepartmentName}
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          <Select
            value={designationFilter}
            onValueChange={setDesignationFilter}
            open={dropdownOpen.designation}
            onOpenChange={(open) => setDropdownOpen({...dropdownOpen, designation: open})}
          >
            <SelectTrigger
              className="w-full lg:w-45 border-border min-w-0 max-w-full"
              title={
                designationFilter === "all"
                  ? "All Designations"
                  : designations.data?.find(
                      (d) => d.strDesignationGUID === designationFilter
                    )?.strName
              }
              disabled={designations.isLoading}
            >
              <div className="truncate flex-1 text-left">
                {designations.isLoading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  <SelectValue placeholder="Filter by designation" />
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              {designations.isLoading ? (
                <div className="space-y-2 p-2 w-full">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-sm" />
                  ))}
                </div>
              ) : (
                <>
                  <SelectItem value="all">All Designations</SelectItem>
                  {designations.data?.map((desig) => (
                    <SelectItem
                      key={desig.strDesignationGUID}
                      value={desig.strDesignationGUID}
                      title={desig.strName}
                    >
                      <span className="truncate block">{desig.strName}</span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger
              className="w-full xs:col-span-2 border-border md:col-span-1 lg:w-45 min-w-0 max-w-full"
              title={
                priorityFilter === "all" ? "All Priorities" : priorityFilter
              }
            >
              <div className="truncate flex-1 text-left">
                <SelectValue placeholder="Filter by priority" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="High" className="pl-2 pr-2 [&_svg]:hidden">
                <span className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded ${PRIORITY_COLOR_CLASS["High"]}`}
                  />
                  High
                </span>
              </SelectItem>
              <SelectItem value="Medium" className="pl-2 pr-2 [&_svg]:hidden">
                <span className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded ${PRIORITY_COLOR_CLASS["Medium"]}`}
                  />
                  Medium
                </span>
              </SelectItem>
              <SelectItem value="Low" className="pl-2 pr-2 [&_svg]:hidden">
                <span className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded ${PRIORITY_COLOR_CLASS["Low"]}`}
                  />
                  Low
                </span>
              </SelectItem>
              <SelectItem value="None" className="pl-2 pr-2 [&_svg]:hidden">
                <span className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded ${PRIORITY_COLOR_CLASS["None"]}`}
                  />
                  None
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
                <Skeleton className="h-5 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full rounded" />
                  <Skeleton className="h-8 w-full rounded" />
                </div>
                <Skeleton className="h-20 w-full rounded-lg" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-6 w-16 rounded" />
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error && !isUserStatus400Error ? (
        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <div className="flex items-start gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Unable to load user status</p>
              <p className="text-sm mt-1 opacity-90">
                {error instanceof Error
                  ? error.message
                  : "An error occurred while fetching user status data. Please try again later."}
              </p>
            </div>
          </div>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No users found</p>
            <p className="text-sm mt-1">
              {userFilter === "all"
                ? "There are no active users in your organization"
                : `No ${userFilter} users found`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user: UserStatus) => (
            <div
              key={user.strUserGUID}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <UserTaskCard user={user} className="cursor-default" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
