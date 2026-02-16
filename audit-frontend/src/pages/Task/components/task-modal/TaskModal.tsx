import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, MoreVertical, MoveRight, Pencil, Trash2, X } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import type { AttachmentFile } from "@/types/common";
import type { Document } from "@/types/central/document";
import type { Task, TaskCreate, TaskRecurrence } from "@/types/task/task";

interface LocalBoardSection {
  strBoardSectionGUID: string;
  strName: string;
}

import { Actions, ModuleBase, useCanSave, useCanView } from "@/lib/permissions";

import { cn, getImagePath } from "@/lib/utils";
import { formatRecurrenceSummary } from "@/lib/task/task";

import {
  PRIORITY_COLOR_CLASS,
  PRIORITY_OPTIONS,
  STATUS_COLOR_BOX,
  STATUS_OPTIONS,
} from "@/constants/Task/task";

import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useBulkAssignDocuments } from "@/hooks/api/central/use-documents";
import { useModuleUsers } from "@/hooks/api/central/use-users";
import { useBoardSectionsByBoardGuid } from "@/hooks/api/task/use-board-sections";
import {
  useCreateTask,
  useDeleteTask,
  useTask,
  useUpdateTask,
} from "@/hooks/api/task/use-task";
import {
  useAssignedTask,
  useCreateAssignedTask,
  useDeleteAssignedTask,
  useUpdateAssignedTask,
} from "@/hooks/api/task/use-assign-task";
import {
  useCreateReviewTask,
  useDeleteReviewTask,
  useReviewTask,
  useUpdateReviewTask,
} from "@/hooks/api/task/use-review-task";
import { useCreateTaskChecklist } from "@/hooks/api/task/use-task-checklist";
import {
  useBoardsByUser,
  useBoardUsers,
  boardTeamQueryKeys,
} from "@/hooks/api/task/use-board-team";
import { useActiveBoardTeamGroups } from "@/hooks/api/task/use-board-team-group";
import { useActiveBoardSubModules } from "@/hooks/api/task/use-board-sub-module";

import { createTaskSchema, type CreateTaskFormData } from "@/validations";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalDialog } from "@/components/ui/modal-dialog";
import {
  ReminderPicker,
  type ReminderRecipient,
} from "@/components/ui/reminder-picker";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { PreloadedSelectWithAvatar } from "@/components/ui/select/preloaded-select-with-avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WithPermission } from "@/components/ui/with-permission";
import { AttachmentManager } from "@/components/ui/attachments/AttachmentManager";
import {
  AssignmentSelect,
  type AssignmentSelectType,
  type CompletionRule,
} from "../../../../components/ui/select/assignment-select";
import type { TreeItem } from "@/components/ui/select/tree-dropdown/tree-dropdown";

import { ActivityTab } from "@/pages/Task/components/task-modal/ActivityTab";
import { CommentsTab } from "@/pages/Task/components/task-modal/CommentsTab";
import { ReviewList } from "@/pages/Task/components/task-modal/ReviewList";
import { TaskChecklistSection } from "@/pages/Task/components/task-modal/TaskChecklistSection";
import { TaskModalSkeleton } from "@/pages/Task/components/task-modal/TaskModalSkeleton";
import { TaskRecurrenceModal } from "@/pages/Task/components/task-modal/TaskRecurrenceModal";
import { TaskTagsSelector } from "@/pages/Task/components/task-modal/TaskTagsSelector";

import { BulkCreateTaskModal } from "./BulkCreateTaskModal";
import { DuplicateTaskModal } from "./DuplicateTaskModal";
import { MoveTaskModal } from "./MoveTaskModal";
import { SectionModal } from "./SectionModal";
import { SubModuleModal } from "./SubModuleModal";
import BoardFormModal from "@/pages/Task/board/BoardFormModal";

const REVIEW_TASK_STATUS_OPTIONS = [
  { value: "Completed", label: "Completed" },
  { value: "Incomplete", label: "Incomplete" },
  { value: "Reassign", label: "Reassign" },
];

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBeforeSubmit?: (data: TaskCreate) => TaskCreate | Promise<TaskCreate>;
  onSuccess?: (
    task: Task | null,
    mode: "create" | "edit"
  ) => void | Promise<void>;
  onDeleteSuccess?: () => void | Promise<void>;
  boardGUID?: string;
  sectionGUID?: string | null;
  taskGUID?: string;
  mode?: "create" | "edit";
  initialDueDate?: Date;
  permissionModule: string;
}

export function TaskModal({
  open,
  onOpenChange,
  onBeforeSubmit,
  onSuccess,
  onDeleteSuccess,
  boardGUID,
  sectionGUID,
  taskGUID,
  mode = "create",
  initialDueDate,
  permissionModule,
}: TaskModalProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const isMyTaskPage = permissionModule === ModuleBase.MY_TASK;
  const isAssignablePage = permissionModule === ModuleBase.ASSIGN_TASK;
  const isReviewTaskPage = permissionModule === ModuleBase.REVIEW_TASK;
  const isAllTasksPage = permissionModule === ModuleBase.ALL_TASKS;

  // Check permissions for board and section management
  const canCreateBoard = useCanSave(ModuleBase.BOARD);
  const canViewBoard = useCanView(ModuleBase.BOARD);
  const showBoardSettings = canCreateBoard || canViewBoard;

  const invalidateBoardsForUser = async () => {
    await queryClient.invalidateQueries({
      queryKey: boardTeamQueryKeys.list({}),
    });

    if (user?.strUserGUID) {
      await queryClient.invalidateQueries({
        queryKey: [
          ...boardTeamQueryKeys.list({}),
          "user",
          user.strUserGUID,
          "projects",
        ],
      });
    }
  };

  const bulkAssignDocumentsMutation = useBulkAssignDocuments();
  const createChecklistMutation = useCreateTaskChecklist();

  const regularCreateTaskMutation = useCreateTask();
  const regularUpdateTaskMutation = useUpdateTask();
  const regularDeleteTaskMutation = useDeleteTask();

  const assignCreateTaskMutation = useCreateAssignedTask();
  const assignUpdateTaskMutation = useUpdateAssignedTask();
  const assignDeleteTaskMutation = useDeleteAssignedTask();

  const reviewCreateTaskMutation = useCreateReviewTask();
  const reviewUpdateTaskMutation = useUpdateReviewTask();
  const reviewDeleteTaskMutation = useDeleteReviewTask();

  const createTaskMutation = isReviewTaskPage
    ? reviewCreateTaskMutation
    : isAssignablePage
      ? assignCreateTaskMutation
      : regularCreateTaskMutation;
  const updateTaskMutation = isReviewTaskPage
    ? reviewUpdateTaskMutation
    : isAssignablePage
      ? assignUpdateTaskMutation
      : regularUpdateTaskMutation;
  const deleteTaskMutation = isReviewTaskPage
    ? reviewDeleteTaskMutation
    : isAssignablePage
      ? assignDeleteTaskMutation
      : regularDeleteTaskMutation;

  const isSubmitting =
    createTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    deleteTaskMutation.isPending;

  const [isButtonDebouncing, setIsButtonDebouncing] = useState(false);

  const [selectedBoardGUID, setSelectedBoardGUID] = useState<string>(
    boardGUID || ""
  );
  const [lastBoardSelection, setLastBoardSelection] = useState<{
    boardGUID: string;
    sectionGUID: string;
  }>({
    boardGUID: boardGUID || "",
    sectionGUID: sectionGUID || "",
  });
  const [privacySelection, setPrivacySelection] = useState<"private" | "board">(
    "board"
  );

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const [reminderRecipient, setReminderRecipient] = useState<ReminderRecipient>(
    isMyTaskPage ? "for myself" : "for everyone involved in this task"
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStopRecurrenceConfirm, setShowStopRecurrenceConfirm] =
    useState(false);
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] =
    useState(false);
  const [showMoveTaskDialog, setShowMoveTaskDialog] = useState(false);
  const [showDuplicateTaskDialog, setShowDuplicateTaskDialog] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [descriptionContent, setDescriptionContent] = useState("");
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [createModeChecklists, setCreateModeChecklists] = useState<string[]>(
    []
  );
  const [editModeChecklists, setEditModeChecklists] = useState<string[]>([]);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);
  const [showTicketInfo, setShowTicketInfo] = useState(false);
  const [showBoardFormModal, setShowBoardFormModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSubModuleModal, setShowSubModuleModal] = useState(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [reviewedByDropdownOpen, setReviewedByDropdownOpen] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [subModuleDropdownOpen, setSubModuleDropdownOpen] = useState(false);
  const [assignmentType, setAssignmentType] =
    useState<AssignmentSelectType>("USER");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [completionRule, setCompletionRule] =
    useState<CompletionRule>("ANY_ONE");

  const [existingFiles, setExistingFiles] = useState<AttachmentFile[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const debouncedUserSearch = useDebounce(userSearchQuery, 300);

  const shouldFetchBoards =
    open && (boardDropdownOpen || mode === "edit" || !!selectedBoardGUID);

  const { data: userBoardsData, isLoading: isLoadingBoards } = useBoardsByUser(
    user?.strUserGUID,
    shouldFetchBoards
  );
  const boards = userBoardsData?.boards || [];

  const { data: boardSectionsResponse, isLoading: isLoadingSections } =
    useBoardSectionsByBoardGuid(
      selectedBoardGUID,
      {},
      open && (sectionDropdownOpen || mode === "edit")
    );
  const boardSections = boardSectionsResponse?.data || [];

  const shouldFetchTask = open && mode === "edit" && !!taskGUID;

  const { data: regularTask, isLoading: isLoadingRegularTask } = useTask(
    shouldFetchTask && !isAssignablePage && !isReviewTaskPage
      ? taskGUID
      : undefined
  );

  const { data: assignedTask, isLoading: isLoadingAssignedTask } =
    useAssignedTask(shouldFetchTask && isAssignablePage ? taskGUID : undefined);

  const { data: reviewTask, isLoading: isLoadingReviewTask } = useReviewTask(
    shouldFetchTask && isReviewTaskPage ? taskGUID : undefined
  );

  const task = isReviewTaskPage
    ? reviewTask
    : isAssignablePage
      ? assignedTask
      : regularTask;
  const isLoadingTask = isReviewTaskPage
    ? isLoadingReviewTask
    : isAssignablePage
      ? isLoadingAssignedTask
      : isLoadingRegularTask;

  const isPrivateEffective = useMemo(() => {
    return isMyTaskPage
      ? privacySelection === "private"
      : (task?.bolIsPrivate ?? false);
  }, [isMyTaskPage, privacySelection, task?.bolIsPrivate]);

  // Rights: allow Move/Duplicate only when user has board/section permissions
  const canMoveTaskAction = useMemo(() => {
    return !isPrivateEffective && (canViewBoard || canCreateBoard);
  }, [isPrivateEffective, canViewBoard, canCreateBoard]);

  const canDuplicateTaskAction = useMemo(() => {
    return canViewBoard || canCreateBoard;
  }, [canViewBoard, canCreateBoard]);

  const shouldFetchBoardUsers =
    open &&
    selectedBoardGUID &&
    !isPrivateEffective &&
    (assigneeDropdownOpen || mode === "edit") &&
    (isMyTaskPage || isAssignablePage || mode === "edit");

  const { data: boardTeamData, isLoading: isLoadingBoardUsers } = useBoardUsers(
    selectedBoardGUID,
    !!shouldFetchBoardUsers
  );

  const shouldFetchTeams =
    open &&
    !!selectedBoardGUID &&
    !isPrivateEffective &&
    assignmentType === "TEAM" &&
    (assigneeDropdownOpen || mode === "edit");

  const { data: activeTeamGroups = [], isLoading: isLoadingTeams } =
    useActiveBoardTeamGroups(selectedBoardGUID, {
      enabled: shouldFetchTeams,
    });

  const form = useForm<CreateTaskFormData>({
    resolver: zodResolver(
      createTaskSchema
    ) as unknown as Resolver<CreateTaskFormData>,
    defaultValues: {
      strTitle: "",
      strDescription: "",
      strStatus: "Not Started",
      strPriority: "None",
      strAssignedToGUID: "",
      assignments: [],
      strCompletionRule: "ANY_ONE",
      strTicketKey: "",
      strTicketUrl: "",
      strTicketSource: "",
      dtStartDate: undefined,
      intEstimatedMinutes: 0,
      strTags: "",
      strBoardGUID: boardGUID || "",
      strBoardSectionGUID: sectionGUID || "",
      strBoardSubModuleGUID: "",
      bolIsReviewReq: false,
      strReviewedByGUID: null,
      bolIsTimeTrackingReq: false,
      bolIsBillable: false,
      bolIsPrivate: false,
    },
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { errors, submitCount },
    reset,
    setValue,
    getValues,
    watch,
    control,
    setError,
  } = form;

  const selectedSectionGUID = watch("strBoardSectionGUID") || undefined;
  const statusValue = watch("strStatus");
  const isReviewRequired = watch("bolIsReviewReq");

  const shouldFetchModuleUsers =
    open &&
    (assigneeDropdownOpen ||
      mode === "edit" ||
      (reviewedByDropdownOpen &&
        !!selectedBoardGUID &&
        !!selectedSectionGUID) ||
      (isReviewRequired &&
        !!selectedBoardGUID &&
        !!selectedSectionGUID));

  const { data: moduleUsersData = [], isLoading: isLoadingUsers } =
    useModuleUsers(true, debouncedUserSearch, shouldFetchModuleUsers);

  const shouldFetchSubModules =
    open &&
    !!selectedSectionGUID &&
    !isPrivateEffective &&
    (subModuleDropdownOpen || mode === "edit");

  const { data: activeSubModules = [], isLoading: isLoadingSubModules } =
    useActiveBoardSubModules(selectedSectionGUID, {
      enabled: shouldFetchSubModules,
    });
  const canChangePrivacy =
    mode === "create" || (statusValue ?? task?.strStatus) === "Not Started";

  const singleUserAssignmentGuid = useMemo(() => {
    if (!task) return undefined;
    if (task.strAssignedToGUID) return task.strAssignedToGUID;
    const userAssignments = (task.assignments || []).filter(
      (assignment) =>
        (assignment.strAssignToType || "").toUpperCase() === "USER"
    );
    if (userAssignments.length !== 1) return undefined;
    return userAssignments[0]?.strAssignToGUID || undefined;
  }, [task, task?.strAssignedToGUID, task?.assignments]);

  const isSelfAssignedTask = useMemo(() => {
    if (!task?.strAssignedByGUID || !singleUserAssignmentGuid) return false;
    return task.strAssignedByGUID === singleUserAssignmentGuid;
  }, [task?.strAssignedByGUID, singleUserAssignmentGuid]);

  const isEditDisabled = useMemo(() => {
    if (mode === "create") {
      return false;
    }
    if (mode === "edit" && task?.bolIsPrivate) {
      return false;
    }

    if (
      mode === "edit" &&
      !task?.bolIsPrivate &&
      isSelfAssignedTask &&
      task?.strStatus === "Not Started"
    ) {
      return false;
    }

    if (mode === "edit" && isMyTaskPage) {
      const isPrivate = task?.bolIsPrivate ?? false;
      const isNotStarted = task?.strStatus === "Not Started";

      if (!isPrivate && !(isSelfAssignedTask && isNotStarted)) {
        return true;
      }

      return task?.strStatus !== "Not Started";
    }

    if (mode === "edit" && isAssignablePage) {
      return task?.strStatus !== "Not Started";
    }
    if (mode === "edit" && isAllTasksPage) {
      return task?.strStatus !== "Not Started";
    }
    return false;
  }, [
    mode,
    isMyTaskPage,
    isAssignablePage,
    isAllTasksPage,
    task?.strStatus,
    task?.bolIsPrivate,
    isSelfAssignedTask,
  ]);

  const assignableUsers = useMemo(() => {
    if (selectedBoardGUID && !isPrivateEffective && boardTeamData?.users) {
      const boardUsers = boardTeamData.users.map((u) => ({
        strUserGUID: u.strUserGUID,
        strName: u.strUserName || "Unknown",
        strEmailId: u.strUserEmail || "",
        strProfileImg: u.strProfileImg,
      }));
      if (mode === "create") {
        return boardUsers.filter((u) => u.strUserGUID !== user?.strUserGUID);
      }
      return boardUsers;
    }
    if (mode === "create") {
      return moduleUsersData.filter((u) => u.strUserGUID !== user?.strUserGUID);
    }
    return moduleUsersData;
  }, [
    selectedBoardGUID,
    isPrivateEffective,
    boardTeamData,
    moduleUsersData,
    user?.strUserGUID,
    mode,
  ]);

  const teamTreeData = useMemo<TreeItem[]>(() => {
    const mapTeam = (team: (typeof activeTeamGroups)[number]): TreeItem => ({
      id: team.strTeamGUID,
      name: team.strTeamName,
      type: "data",
      children: (team.children || []).map(mapTeam),
    });

    return activeTeamGroups.map(mapTeam);
  }, [activeTeamGroups]);

  const teamOptions = useMemo(() => {
    const flattened: { value: string; label: string }[] = [];
    const flatten = (teams: typeof activeTeamGroups) => {
      teams.forEach((team) => {
        flattened.push({
          value: team.strTeamGUID,
          label: team.strTeamName,
        });
        if (team.children && team.children.length > 0) {
          flatten(team.children);
        }
      });
    };

    flatten(activeTeamGroups);
    return flattened;
  }, [activeTeamGroups]);

  const userOptions = useMemo(() => {
    return assignableUsers.map((u) => ({
      value: u.strUserGUID,
      label: u.strName,
      avatar: getImagePath(u.strProfileImg) as string,
    }));
  }, [assignableUsers]);

  const reviewableUsers = useMemo(() => {
    if (selectedBoardGUID && !isPrivateEffective && boardTeamData?.users) {
      return boardTeamData.users.map((u) => ({
        strUserGUID: u.strUserGUID,
        strName: u.strUserName || "Unknown",
        strEmailId: u.strUserEmail || "",
        strProfileImg: u.strProfileImg,
      }));
    }
    return moduleUsersData;
  }, [selectedBoardGUID, isPrivateEffective, boardTeamData, moduleUsersData]);

  const reviewByOptions = useMemo(() => {
    if (!isReviewRequired || !selectedBoardGUID || !selectedSectionGUID) {
      return [];
    }
    const options = reviewableUsers.map((reviewer) => ({
      value: reviewer.strUserGUID,
      label: reviewer.strName,
      avatar: getImagePath(reviewer.strProfileImg) as string,
    }));

    if (options.length > 0) {
      return options;
    }

    if (user?.strUserGUID) {
      return [
        {
          value: user.strUserGUID,
          label: user.strName || "Current User",
          avatar: getImagePath(user.strProfileImg) as string,
        },
      ];
    }

    return [];
  }, [
    isReviewRequired,
    selectedBoardGUID,
    selectedSectionGUID,
    reviewableUsers,
    user,
  ]);

  useEffect(() => {
    if (!open || !isReviewRequired || !selectedBoardGUID) return;
    if (!selectedSectionGUID) return;
    if (!user?.strUserGUID) return;
    if (getValues("strReviewedByGUID")) return;

    setValue("strReviewedByGUID", user.strUserGUID, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: false,
    });
  }, [
    open,
    isReviewRequired,
    selectedBoardGUID,
    selectedSectionGUID,
    user,
    getValues,
    setValue,
  ]);

  const hasUnsavedChanges = (): boolean => {
    const formValues = form.getValues();

    if (mode === "create") {
      if (formValues.strTitle?.trim()) {
        return true;
      }

      if (
        descriptionContent &&
        descriptionContent.trim() &&
        descriptionContent !== "<p></p>"
      ) {
        return true;
      }

      if (newFiles.length > 0 || filesToRemove.length > 0) {
        return true;
      }

      if (selectedTags.length > 0) {
        return true;
      }

      if (createModeChecklists.length > 0) {
        return true;
      }

      if (dueDate || reminderDate) {
        return true;
      }

      if (form.formState.isDirty) {
        return true;
      }

      return false;
    }

    if (mode === "edit") {
      if (!task) {
        return false;
      }

      const originalDescription = task.strDescription || "";
      const currentDescription = descriptionContent || "";
      if (currentDescription.trim() !== originalDescription.trim()) {
        return true;
      }

      if (newFiles.length > 0 || filesToRemove.length > 0) {
        return true;
      }

      if (selectedDocuments.length > 0) {
        return true;
      }

      const currentBoard = formValues.strBoardGUID || "";
      const originalBoard = task.strBoardGUID || "";
      if (currentBoard !== originalBoard) {
        return true;
      }

      const currentSection = formValues.strBoardSectionGUID || "";
      const originalSection = task.strBoardSectionGUID || "";
      if (currentSection !== originalSection) {
        return true;
      }

      return false;
    }

    return false;
  };

  const handleModalOpenChange = (open: boolean) => {
    if (isMyTaskPage) {
      if (!open && mode === "create") {
        handleClose();
        return;
      }
      onOpenChange(open);
      return;
    }

    if (!open && hasUnsavedChanges()) {
      setShowUnsavedChangesConfirm(true);
    } else {
      if (!open && mode === "create") {
        handleClose();
        return;
      }
      onOpenChange(open);
    }
  };

  const handleConfirmCloseWithoutSaving = () => {
    setShowUnsavedChangesConfirm(false);
    handleClose();
  };

  useEffect(() => {
    setSelectedBoardGUID(boardGUID || "");
    setValue("strBoardGUID", boardGUID || "");
  }, [boardGUID, setValue]);

  useEffect(() => {
    setValue("strBoardGUID", selectedBoardGUID || "");
  }, [selectedBoardGUID, setValue]);

  const handleBoardChange = (newBoardGUID: string) => {
    setSelectedBoardGUID(newBoardGUID);
    setValue("strBoardSectionGUID", "");
    setValue("strBoardSubModuleGUID", "");
    form.clearErrors("strBoardGUID");
    setLastBoardSelection({
      boardGUID: newBoardGUID,
      sectionGUID: "",
    });
  };

  useEffect(() => {
    const subscription = watch((values) => {
      const currentBoard = (values.strBoardGUID as string) || "";
      const currentSection = (values.strBoardSectionGUID as string) || "";
      if (currentBoard) {
        setLastBoardSelection({
          boardGUID: currentBoard,
          sectionGUID: currentSection,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    const isPrivate = isMyTaskPage
      ? privacySelection === "private"
      : (task?.bolIsPrivate ?? false);
    setValue("bolIsPrivate", isPrivate);

    if (!isPrivate) {
      const currentBoardGUID = watch("strBoardGUID");
      const currentSectionGUID = watch("strBoardSectionGUID");

      if (!currentBoardGUID && (selectedBoardGUID || boardGUID)) {
        setValue("strBoardGUID", selectedBoardGUID || boardGUID);
      }

      if (!currentSectionGUID && sectionGUID) {
        setValue("strBoardSectionGUID", sectionGUID);
      }
    } else {
      setValue("bolIsBillable", false, {
        shouldDirty: true,
        shouldValidate: false,
        shouldTouch: false,
      });
      setValue("bolIsTimeTrackingReq", false, {
        shouldDirty: true,
        shouldValidate: false,
        shouldTouch: false,
      });
      setValue("intEstimatedMinutes", 0, {
        shouldDirty: true,
        shouldValidate: false,
        shouldTouch: false,
      });
    }
  }, [
    privacySelection,
    isMyTaskPage,
    task,
    setValue,
    selectedBoardGUID,
    boardGUID,
    sectionGUID,
    watch,
  ]);

  useEffect(() => {
    if (!open) return;
    if (mode !== "edit") return;
    const dto = (task as Task | null)?.recurrence || null;
    if (dto) {
      setRecurrence({ ...dto });
    } else {
      setRecurrence(null);
    }
  }, [open, mode, task]);

  useEffect(() => {
    if (!open) return;
    if (mode !== "edit") return;
    if (!task) return;

    if (isMyTaskPage && task.bolIsPrivate !== undefined) {
      setPrivacySelection(task.bolIsPrivate ? "private" : "board");
    }
  }, [open, mode, task, isMyTaskPage]);

  useEffect(() => {
    if (mode === "edit" && task?.strFiles) {
      const files: AttachmentFile[] = task.strFiles.map((file) => ({
        strDocumentAssociationGUID: file.strDocumentAssociationGUID,
        strFileName: file.strFileName,
        strFileType: file.strFileType || "",
        strFileSize: file.strFileSize || "",
        strFilePath: file.strFilePath || undefined,
      }));
      setExistingFiles(files);
    } else {
      setExistingFiles([]);
    }
    setNewFiles([]);
    setFilesToRemove([]);
    setSelectedDocuments([]);
  }, [mode, task?.strFiles, open]);

  useEffect(() => {
    const subscription = watch((values) => {
      const isBillable = values.bolIsBillable as boolean;
      const isTimeTrackingReq = values.bolIsTimeTrackingReq as boolean;

      if (isBillable && !isTimeTrackingReq) {
        setValue("bolIsTimeTrackingReq", true);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  useEffect(() => {
    if (!open || mode !== "edit" || !task) return;
    // Wait for users to load once; avoid reruns on search query changes
    if (isLoadingUsers) return;

    const taskSectionGUID = sectionGUID || task.strBoardSectionGUID || "";
    const taskBoardGUID = task.strBoardGUID || boardGUID || "";

    setSelectedBoardGUID(taskBoardGUID);

    const normalizeAssignmentType = (
      value?: string | null
    ): AssignmentSelectType =>
      value?.toUpperCase() === "TEAM" ? "TEAM" : "USER";

    const normalizedAssignments: Array<{
      strAssignToGUID: string;
      strAssignToType: "USER" | "TEAM";
    }> =
      task.assignments && task.assignments.length > 0
        ? task.assignments
            .map((assignment) => ({
              strAssignToGUID: assignment.strAssignToGUID,
              strAssignToType: normalizeAssignmentType(
                assignment.strAssignToType
              ),
            }))
            .filter((assignment) => Boolean(assignment.strAssignToGUID))
        : task.strAssignedToGUID
          ? [
              {
                strAssignToGUID: task.strAssignedToGUID,
                strAssignToType: "USER",
              },
            ]
          : [];

    const assignmentTypeFromTask: AssignmentSelectType =
      normalizedAssignments.some(
        (assignment) => assignment.strAssignToType === "TEAM"
      )
        ? "TEAM"
        : "USER";

    const assignmentIds = normalizedAssignments.map(
      (assignment) => assignment.strAssignToGUID
    );

    reset(
      {
        strTitle: task.strTitle,
        strDescription: task.strDescription || "",
        strStatus: task.strStatus,
        strPriority: task.strPriority,
        strAssignedToGUID:
          assignmentTypeFromTask === "USER" ? assignmentIds[0] || "" : "",
        assignments: normalizedAssignments,
        strCompletionRule:
          task.strCompletionRule === "ALL_USERS" ? "ALL_USERS" : "ANY_ONE",
        strTicketKey: task.strTicketKey || "",
        strTicketUrl: task.strTicketUrl || "",
        strTicketSource: task.strTicketSource || "",
        dtStartDate: task.dtStartDate ? new Date(task.dtStartDate) : new Date(),
        intEstimatedMinutes: task.intEstimatedMinutes ?? undefined,
        strTags: task.strTags || "",
        strBoardGUID: taskBoardGUID,
        strBoardSectionGUID: taskSectionGUID,
        strBoardSubModuleGUID: task.strBoardSubModuleGUID || "",
        bolIsReviewReq: task.bolIsReviewReq || false,
        strReviewedByGUID: task.strReviewedByGUID || null,
        bolIsTimeTrackingReq: task.bolIsTimeTrackingReq || false,
        bolIsBillable: task.bolIsBillable ?? false,
        bolIsPrivate: task.bolIsPrivate ?? false,
      },
      {
        keepDefaultValues: false,
        keepDirty: false,
        keepTouched: false,
        keepIsSubmitted: false,
        keepErrors: false,
        keepIsValid: false,
        keepSubmitCount: false,
      }
    );

    setAssignmentType(assignmentTypeFromTask);
    setSelectedAssigneeIds(assignmentIds);
    setCompletionRule(
      task.strCompletionRule === "ALL_USERS" ? "ALL_USERS" : "ANY_ONE"
    );

    setTimeout(() => {
      setValue(
        "strAssignedToGUID",
        assignmentTypeFromTask === "USER" ? assignmentIds[0] || "" : "",
        {
          shouldValidate: true,
          shouldDirty: false,
          shouldTouch: false,
        }
      );
      setValue("assignments", normalizedAssignments, {
        shouldValidate: true,
        shouldDirty: false,
        shouldTouch: false,
      });
      setValue(
        "strCompletionRule",
        task.strCompletionRule === "ALL_USERS" ? "ALL_USERS" : "ANY_ONE",
        { shouldValidate: false, shouldDirty: false, shouldTouch: false }
      );
    }, 0);

    setTimeout(() => {
      setValue("strStatus", task.strStatus || "Not Started", {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
    }, 0);

    setStartDate(task.dtStartDate ? new Date(task.dtStartDate) : new Date());
    setDueDate(task.dtDueDate ? new Date(task.dtDueDate) : undefined);
    setReminderDate(
      task.dtReminderDate ? new Date(task.dtReminderDate) : undefined
    );

    if (task.strReminderTo) {
      setReminderRecipient(task.strReminderTo as ReminderRecipient);
    }

    const existingTags = task.strTags
      ? task.strTags
          .split(",")
          .map((tag) => tag.trim().replace(/^"|"$/g, ""))
          .filter(Boolean)
      : [];
    setSelectedTags(existingTags);

    setTimeout(() => {
      setDescriptionContent(task.strDescription || "");
    }, 0);

    const hasTicketInfo = Boolean(
      (task.strTicketKey && task.strTicketKey.trim() !== "") ||
      (task.strTicketUrl && task.strTicketUrl.trim() !== "") ||
      (task.strTicketSource && task.strTicketSource.trim() !== "")
    );
    setShowTicketInfo(hasTicketInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task, mode, initialDueDate, user, isMyTaskPage, isLoadingUsers]);

  useEffect(() => {
    if (!open || mode !== "create") return;

    setShowRecurrence(false);
    setRecurrence(null);
    reset({
      strTitle: "",
      strDescription: "",
      strStatus: "Not Started",
      strPriority: "None",
      strAssignedToGUID: isMyTaskPage ? user?.strUserGUID || "" : "",
      assignments:
        isMyTaskPage && user?.strUserGUID
          ? [
              {
                strAssignToGUID: user.strUserGUID,
                strAssignToType: "USER",
              },
            ]
          : [],
      strCompletionRule: "ANY_ONE",
      strTicketKey: "",
      strTicketUrl: "",
      strTicketSource: "",
      dtStartDate: new Date(),
      intEstimatedMinutes: 0,
      strTags: "",
      strBoardGUID: boardGUID || "",
      strBoardSectionGUID: sectionGUID || "",
      strBoardSubModuleGUID: "",
      bolIsReviewReq: false,
      strReviewedByGUID: null,
      bolIsTimeTrackingReq: false,
      bolIsBillable: false,
      bolIsPrivate: false,
    });

    setAssignmentType("USER");
    setSelectedAssigneeIds(
      isMyTaskPage && user?.strUserGUID ? [user.strUserGUID] : []
    );
    setCompletionRule("ANY_ONE");

    setStartDate(new Date());
    setDueDate(initialDueDate);
    setReminderDate(undefined);
    setReminderRecipient(
      isMyTaskPage ? "for myself" : "for everyone involved in this task"
    );
    setSelectedTags([]);
    setDescriptionContent("");
    setCreateModeChecklists([]);
    setEditModeChecklists([]);
    setShowTicketInfo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initialDueDate, isMyTaskPage, user, boardGUID, sectionGUID]);

  const handleNewFileAdd = (files: File[]) => {
    setNewFiles((prev) => [...prev, ...files]);
  };

  const handleNewFileRemove = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExistingFileRemove = (guid: string) => {
    setFilesToRemove((prev) => [...prev, guid]);
    setExistingFiles((prev) =>
      prev.filter((file) => file.strDocumentAssociationGUID !== guid)
    );
  };

  const handleAttachFromDocuments = (documents: Document[]) => {
    setSelectedDocuments(documents);
  };

  const handleSelectedDocumentRemove = (guid: string) => {
    setSelectedDocuments((prev) =>
      prev.filter((doc) => doc.strDocumentGUID !== guid)
    );
  };

  const handleFormSubmit = async (data: CreateTaskFormData) => {
    if (isButtonDebouncing) {
      return;
    }
    if (isReviewTaskPage && mode === "edit") {
      if (
        !data.strStatus ||
        data.strStatus.trim() === "" ||
        data.strStatus === "For Review"
      ) {
        setError("strStatus", {
          type: "manual",
          message: "Please select a status",
        });
        return;
      }
    }

    if (data.bolIsTimeTrackingReq) {
      const estimated = Number(data.intEstimatedMinutes ?? 0);
      if (!estimated || estimated <= 0) {
        setError("intEstimatedMinutes", {
          type: "manual",
          message: "Estimated time is required",
        });
        return;
      }
    }

    if (showTicketInfo) {
      const tk = (data.strTicketKey || "").trim();
      const tu = (data.strTicketUrl || "").trim();
      const ts = (data.strTicketSource || "").trim();

      let hasError = false;
      if (!ts) {
        setError("strTicketSource", {
          type: "manual",
          message: "Ticket Source is required",
        });
        hasError = true;
      }
      if (!tk) {
        setError("strTicketKey", {
          type: "manual",
          message: "Ticket Key is required",
        });
        hasError = true;
      }
      if (!tu) {
        setError("strTicketUrl", {
          type: "manual",
          message: "Ticket URL is required",
        });
        hasError = true;
      }
      if (hasError) return;
    }

    const formatDate = (d?: Date | null) => {
      if (!d) return undefined;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}T00:00:00`;
    };

    const formatReminderDate = (d?: Date) => {
      if (!d) return undefined;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const cleanString = (value?: string | null) => {
      const trimmed = value?.trim();
      return trimmed && trimmed.length > 0 ? trimmed : undefined;
    };

    const isPrivate = isMyTaskPage
      ? privacySelection === "private"
      : (task?.bolIsPrivate ?? false);

    const toGuid = (value: string | null | undefined) =>
      value && value.trim() !== "" ? value : undefined;

    // In CREATE mode, always force status to "Not Started" to prevent accidental "For Review" status
    // Tasks should only get "For Review" status through explicit "Submit for Review" action
    const taskStatus =
      mode === "create" ? "Not Started" : data.strStatus || "Not Started";

    const shouldDefaultAssignee =
      mode === "create" &&
      isMyTaskPage &&
      !!user?.strUserGUID &&
      selectedAssigneeIds.length === 0;

    const effectiveAssigneeIds = shouldDefaultAssignee
      ? [user.strUserGUID]
      : selectedAssigneeIds;

    const effectiveAssignmentType: AssignmentSelectType = shouldDefaultAssignee
      ? "USER"
      : assignmentType;

    const effectiveCompletionRule: CompletionRule = shouldDefaultAssignee
      ? "ANY_ONE"
      : completionRule;

    const assignments =
      effectiveAssigneeIds.length > 0
        ? effectiveAssigneeIds.map((assigneeGuid) => ({
            strAssignToGUID: assigneeGuid,
            strAssignToType: effectiveAssignmentType,
          }))
        : undefined;

    const assignToGuid =
      effectiveAssignmentType === "USER" && effectiveAssigneeIds.length > 0
        ? effectiveAssigneeIds[0]
        : undefined;

    let taskData: TaskCreate = {
      strBoardGUID: isPrivate
        ? undefined
        : toGuid(data.strBoardGUID || selectedBoardGUID || boardGUID),
      strBoardSectionGUID: isPrivate
        ? undefined
        : toGuid(data.strBoardSectionGUID || sectionGUID || undefined),
      strBoardSubModuleGUID: toGuid(data.strBoardSubModuleGUID),
      strTitle: data.strTitle,
      strDescription:
        descriptionContent &&
        descriptionContent.trim() &&
        descriptionContent !== "<p></p>"
          ? descriptionContent
          : "",
      strTicketKey: cleanString(data.strTicketKey),
      strTicketUrl: cleanString(data.strTicketUrl),
      strTicketSource: cleanString(data.strTicketSource),
      strStatus: taskStatus,
      strPriority: data.strPriority || "None",
      strAssignedToGUID: assignToGuid,
      assignments,
      strCompletionRule: effectiveCompletionRule,
      dtStartDate: formatDate(data.dtStartDate),
      dtDueDate: formatDate(dueDate),
      dtReminderDate: formatReminderDate(reminderDate),
      strReminderTo: reminderRecipient,
      intEstimatedMinutes: data.bolIsTimeTrackingReq
        ? (data.intEstimatedMinutes ?? 0)
        : 0,
      strTags: selectedTags.map((tag) => `"${tag}"`).join(","),
      bolIsPrivate: isMyTaskPage ? isPrivate : undefined,
      bolIsReviewReq: data.bolIsReviewReq || false,
      strReviewedByGUID: data.strReviewedByGUID,
      bolIsTimeTrackingReq: data.bolIsTimeTrackingReq || false,
      bolIsBillable: data.bolIsBillable || false,
      strChecklists:
        mode === "create"
          ? createModeChecklists.length > 0
            ? createModeChecklists
            : undefined
          : undefined,
      recurrence: recurrence,
    };

    if (onBeforeSubmit) {
      taskData = await onBeforeSubmit(taskData);
    }

    setIsButtonDebouncing(true);
    setTimeout(() => setIsButtonDebouncing(false), 1000);

    try {
      let result: Task | null;

      if (mode === "edit" && taskGUID) {
        if (isReviewTaskPage) {
          result = await (
            updateTaskMutation as ReturnType<typeof useUpdateReviewTask>
          ).mutateAsync({
            taskGuid: taskGUID,
            data: taskData,
            files: newFiles.length > 0 ? newFiles : undefined,
            strRemoveDocumentAssociationGUIDs:
              filesToRemove.length > 0 ? filesToRemove : undefined,
          });
        } else if (isAssignablePage) {
          result = await (
            updateTaskMutation as ReturnType<typeof useUpdateAssignedTask>
          ).mutateAsync({
            guid: taskGUID,
            data: taskData,
            files: newFiles.length > 0 ? newFiles : undefined,
            strRemoveDocumentAssociationGUIDs:
              filesToRemove.length > 0 ? filesToRemove : undefined,
          });
        } else {
          result = await (
            updateTaskMutation as ReturnType<typeof useUpdateTask>
          ).mutateAsync({
            id: taskGUID,
            data: taskData,
            files: newFiles.length > 0 ? newFiles : undefined,
            strRemoveDocumentAssociationGUIDs:
              filesToRemove.length > 0 ? filesToRemove : undefined,
          });
        }

        if (selectedDocuments.length > 0) {
          const selectedDocumentGUIDs = selectedDocuments.map(
            (doc) => doc.strDocumentGUID
          );
          await bulkAssignDocumentsMutation.mutateAsync({
            strDocumentGUIDs: selectedDocumentGUIDs,
            strEntityGUID: taskGUID,
            strEntityName: "Task",
            strEntityValue: task?.strTitle || "",
          });
        }

        // Create new checklists that were added in edit mode
        if (editModeChecklists.length > 0) {
          const existingCount = task?.strChecklists?.length || 0;
          for (let i = 0; i < editModeChecklists.length; i++) {
            await createChecklistMutation.mutateAsync({
              strTaskGUID: taskGUID,
              strTitle: editModeChecklists[i],
              intPosition: existingCount + i,
            });
          }
          setEditModeChecklists([]);
        }

        setNewFiles([]);
        setFilesToRemove([]);
      } else {
        result = await createTaskMutation.mutateAsync({
          task: taskData,
          files: newFiles.length > 0 ? newFiles : undefined,
        });

        if (selectedDocuments.length > 0 && result?.strTaskGUID) {
          const selectedDocumentGUIDs = selectedDocuments.map(
            (doc) => doc.strDocumentGUID
          );
          await bulkAssignDocumentsMutation.mutateAsync({
            strDocumentGUIDs: selectedDocumentGUIDs,
            strEntityGUID: result.strTaskGUID,
            strEntityName: "Task",
            strEntityValue: result.strTitle,
          });
        }

        setNewFiles([]);
      }

      if (onSuccess) {
        await onSuccess(result ?? null, mode);
      }

      handleClose();
    } catch (error) {
      console.error("Task submission error:", error);
      throw error;
    }
  };

  const handleClose = () => {
    reset();
    setStartDate(undefined);
    setDueDate(undefined);
    setReminderDate(undefined);
    setNewFiles([]);
    setFilesToRemove([]);
    setSelectedDocuments([]);
    if (mode === "create") {
      setDescriptionContent("");
      setCreateModeChecklists([]);
      setPrivacySelection("board");
      setSelectedBoardGUID("");
      setValue("strBoardGUID", "");
      setValue("strBoardSectionGUID", "");
      setValue("strBoardSubModuleGUID", "");
      setLastBoardSelection({
        boardGUID: "",
        sectionGUID: "",
      });
    } else {
      setDescriptionContent(task?.strDescription || "");
      setEditModeChecklists([]);
    }
    if (open) {
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    const currentStatus = watch("strStatus");
    if (currentStatus && currentStatus !== "Not Started") {
      toast.error("You can delete a task only when status is Not Started");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskGUID) return;

    if (isReviewTaskPage) {
      await (
        deleteTaskMutation as ReturnType<typeof useDeleteReviewTask>
      ).mutateAsync({ taskGuid: taskGUID });
    } else if (isAssignablePage) {
      await (
        deleteTaskMutation as ReturnType<typeof useDeleteAssignedTask>
      ).mutateAsync({ guid: taskGUID });
    } else {
      await (
        deleteTaskMutation as ReturnType<typeof useDeleteTask>
      ).mutateAsync({ id: taskGUID });
    }

    if (onDeleteSuccess) {
      await onDeleteSuccess();
    }

    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  const taskNumberLabel =
    task?.strTaskNo || task?.strTaskNo === 0 ? `#${task.strTaskNo}` : "";

  const modalTitle = `${mode === "edit" ? "Edit Task" : "Create New Task"} ${taskNumberLabel}`;

  return (
    <>
      <ModalDialog
        open={open}
        onOpenChange={handleModalOpenChange}
        title={modalTitle}
        description={
          mode === "edit"
            ? "Update the task details."
            : "Create a new task for this board."
        }
        maxWidth="900px"
        className="h-[90vh] max-sm:h-[95vh] max-sm:w-[95vw] max-sm:max-w-[95vw] max-md:w-[90vw] max-md:max-w-[90vw]"
        showCloseButton={false}
        preventOutsideClick={true}
        footerContent={
          <>
            <div className="flex items-center gap-2">
              {mode === "edit" &&
                (!isMyTaskPage ||
                  (isMyTaskPage &&
                    task?.strAssignedByGUID === user?.strUserGUID &&
                    task?.strStatus === "Not Started")) &&
                (isAssignablePage || isReviewTaskPage || isAllTasksPage
                  ? task?.strStatus === "Not Started"
                  : true) && (
                  <WithPermission
                    module={permissionModule}
                    action={Actions.DELETE}
                  >
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="text-xs sm:text-sm"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </WithPermission>
                )}
            </div>
            <div className="flex items-center gap-2">
              {mode === "create" && (
                <WithPermission module={permissionModule} action={Actions.SAVE}>
                  <Button
                    type="submit"
                    form="task-form"
                    disabled={isButtonDebouncing || isSubmitting}
                    className="text-xs sm:text-sm"
                  >
                    {isSubmitting ? "Creating..." : "Create"}
                  </Button>
                </WithPermission>
              )}
              {((!isMyTaskPage && mode === "edit") ||
                (mode === "edit" && task?.bolIsPrivate) ||
                (mode === "edit" &&
                  !task?.bolIsPrivate &&
                  isSelfAssignedTask &&
                  task?.strStatus === "Not Started")) && (
                <WithPermission module={permissionModule} action={Actions.EDIT}>
                  <Button
                    type="submit"
                    form="task-form"
                    disabled={
                      isEditDisabled || isButtonDebouncing || isSubmitting
                    }
                    className="text-xs sm:text-sm"
                  >
                    {isSubmitting ? "Updating..." : "Update"}
                  </Button>
                </WithPermission>
              )}
            </div>
          </>
        }
      >
        {mode === "edit" && taskGUID ? (
          <div className="absolute right-2 top-2 sm:right-4 sm:top-4 z-50 flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canMoveTaskAction && (
                  <DropdownMenuItem
                    onClick={() => setShowMoveTaskDialog(true)}
                    className="cursor-pointer"
                  >
                    <MoveRight className="mr-2 h-4 w-4" />
                    Move Task
                  </DropdownMenuItem>
                )}
                {canDuplicateTaskAction && (
                  <DropdownMenuItem
                    onClick={() => setShowDuplicateTaskDialog(true)}
                    className="cursor-pointer"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Task
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => handleModalOpenChange(false)}
              aria-label="Close"
            >
              <X className="h-4.5 w-4" />
            </button>
          </div>
        ) : (
          <div className="absolute right-2 top-2 sm:right-4 sm:top-4 z-50 flex items-center">
            <button
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => handleModalOpenChange(false)}
              aria-label="Close"
            >
              <X className="h-4.5 w-4" />
            </button>
          </div>
        )}
        {mode === "edit" && (isLoadingTask || isLoadingUsers) ? (
          <TaskModalSkeleton />
        ) : (
          <Form {...form}>
            <form
              id="task-form"
              onSubmit={handleSubmit(handleFormSubmit)}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
            >
              <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 h-full">
                <div className="flex-1 space-y-3 sm:space-y-4 xl:pr-4">
                  <div className="space-y-4">
                    {isMyTaskPage && (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border-border-color p-2 sm:p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs sm:text-sm">
                            Keep this Private?
                          </FormLabel>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">
                            {privacySelection === "private"
                              ? "Only you and those you've assigned this Task to can view it."
                              : "This Task will be added to a module in one of Projects."}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={privacySelection === "private"}
                            onCheckedChange={(checked) => {
                              const val = checked ? "private" : "board";
                              setPrivacySelection(val);
                              if (checked) {
                                setLastBoardSelection({
                                  boardGUID:
                                    watch("strBoardGUID") ||
                                    selectedBoardGUID ||
                                    lastBoardSelection.boardGUID,
                                  sectionGUID:
                                    watch("strBoardSectionGUID") ||
                                    lastBoardSelection.sectionGUID,
                                });
                                setSelectedBoardGUID("");
                                setValue("strBoardGUID", "");
                                setValue("strBoardSectionGUID", "");
                                setValue("strBoardSubModuleGUID", "");
                              } else {
                                const restoreBoard =
                                  lastBoardSelection.boardGUID ||
                                  boardGUID ||
                                  "";
                                const restoreSection =
                                  lastBoardSelection.sectionGUID || "";
                                setSelectedBoardGUID(restoreBoard);
                                setValue("strBoardGUID", restoreBoard);
                                setValue("strBoardSectionGUID", restoreSection);
                              }
                            }}
                            disabled={isEditDisabled || !canChangePrivacy}
                          />
                        </FormControl>
                      </FormItem>
                    )}

                    <FormField
                      control={control}
                      name="strBoardGUID"
                      render={({ field }) => (
                        <>
                          {(isMyTaskPage || isAssignablePage) &&
                          !isPrivateEffective ? (
                            <FormItem>
                              <FormLabel>
                                Project <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <PreloadedSelect
                                  options={boards.map((board) => ({
                                    value: board.strBoardGUID,
                                    label:
                                      board.strBoardName || "Unnamed Project",
                                  }))}
                                  selectedValue={
                                    field.value || selectedBoardGUID
                                  }
                                  onChange={(val) => {
                                    field.onChange(val);
                                    handleBoardChange(val);
                                  }}
                                  onOpenChange={setBoardDropdownOpen}
                                  placeholder="Select project"
                                  disabled={isEditDisabled}
                                  clearable={false}
                                  isLoading={isLoadingBoards}
                                  showSettings={showBoardSettings}
                                  onSettingsClick={() =>
                                    setShowBoardFormModal(true)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          ) : (
                            <input
                              type="hidden"
                              {...field}
                              value={selectedBoardGUID || ""}
                            />
                          )}
                        </>
                      )}
                    />

                    {(isMyTaskPage || isAssignablePage) &&
                      !isPrivateEffective && (
                        <FormField
                          control={control}
                          name="strBoardSectionGUID"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Module <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <PreloadedSelect
                                  options={boardSections.map(
                                    (s: LocalBoardSection) => ({
                                      value: s.strBoardSectionGUID,
                                      label: s.strName,
                                    })
                                  )}
                                  selectedValue={field.value || ""}
                                  onChange={(value) => {
                                    field.onChange(value);
                                    setValue("strBoardSubModuleGUID", "");
                                  }}
                                  placeholder={
                                    !selectedBoardGUID
                                      ? "Select project first"
                                      : "Select module"
                                  }
                                  disabled={
                                    isEditDisabled || !selectedBoardGUID
                                  }
                                  clearable={false}
                                  isLoading={isLoadingSections}
                                  showSettings={showBoardSettings}
                                  onSettingsClick={() =>
                                    setShowSectionModal(true)
                                  }
                                  onOpenChange={setSectionDropdownOpen}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                    {(isMyTaskPage || isAssignablePage) &&
                      !isPrivateEffective && (
                        <FormField
                          control={control}
                          name="strBoardSubModuleGUID"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sub module</FormLabel>
                              <FormControl>
                                <PreloadedSelect
                                  options={activeSubModules.map(
                                    (subModule) => ({
                                      value: subModule.strBoardSubModuleGUID,
                                      label: subModule.strName,
                                    })
                                  )}
                                  selectedValue={field.value || ""}
                                  onChange={field.onChange}
                                  placeholder={
                                    !selectedSectionGUID
                                      ? "Select module first"
                                      : "Select sub module"
                                  }
                                  disabled={
                                    isEditDisabled || !selectedSectionGUID
                                  }
                                  clearable={true}
                                  isLoading={isLoadingSubModules}
                                  showSettings={showBoardSettings}
                                  onSettingsClick={() =>
                                    setShowSubModuleModal(true)
                                  }
                                  onOpenChange={setSubModuleDropdownOpen}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                  </div>
                  <FormField
                    control={control}
                    name="strTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Task Title <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Add Task title"
                            {...field}
                            disabled={isEditDisabled}
                            className={cn(errors.strTitle && "border-red-500")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-3">
                    {(!isEditDisabled ||
                      (task?.strChecklists &&
                        task.strChecklists.length > 0)) && (
                      <FormLabel className="mb-2">Sub Task</FormLabel>
                    )}
                    <TaskChecklistSection
                      mode={mode}
                      taskGUID={task?.strTaskGUID}
                      readOnly={isEditDisabled}
                      createModeChecklists={createModeChecklists}
                      onCreateModeChecklistsChange={setCreateModeChecklists}
                      checklists={task?.strChecklists}
                      editModeChecklists={editModeChecklists}
                      onEditModeChecklistsChange={setEditModeChecklists}
                    />

                    <div className="space-y-2">
                      <div
                        className="mt-2"
                        ref={editorContainerRef}
                        onBlur={() => {
                          setTimeout(() => {
                            const active =
                              document.activeElement as HTMLElement | null;
                            if (
                              editorContainerRef.current &&
                              active &&
                              editorContainerRef.current.contains(active)
                            ) {
                              return;
                            }
                            const isEmpty =
                              !descriptionContent ||
                              descriptionContent.trim() === "" ||
                              descriptionContent === "<p></p>" ||
                              descriptionContent === "<p><br></p>" ||
                              descriptionContent
                                .replace(/<[^>]*>/g, "")
                                .trim() === "";
                            if (isEmpty) {
                              setDescriptionContent("");
                              setValue("strDescription", "");
                            }
                          }, 0);
                        }}
                      >
                        <FormLabel className="mb-2">Task Notes</FormLabel>
                        <RichTextEditor
                          content={descriptionContent}
                          onChange={(content) => {
                            setDescriptionContent(content);
                            setValue("strDescription", content);
                          }}
                          placeholder="Add your task notes here..."
                          className="bg-muted border border-border-color rounded-md h-65"
                          autoFocus={false}
                          editable={!isEditDisabled}
                          showDisabledToolbar={
                            isEditDisabled && task?.strStatus === "Started"
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <AttachmentManager
                        existingFiles={existingFiles}
                        onExistingFileRemove={handleExistingFileRemove}
                        onNewFileAdd={handleNewFileAdd}
                        onNewFileRemove={handleNewFileRemove}
                        newFiles={newFiles}
                        onAttachFromDocuments={handleAttachFromDocuments}
                        selectedDocuments={selectedDocuments}
                        onSelectedDocumentRemove={handleSelectedDocumentRemove}
                        module="task"
                        readOnly={isEditDisabled}
                      />

                      {mode === "edit" && taskGUID && (
                        <div className="border-t border-border-color rounded-lg bg-card">
                          <Tabs defaultValue="activities" className="w-full">
                            <div className="bg-card overflow-x-auto">
                              <TabsList className="w-full justify-start rounded-none bg-transparent h-auto p-0 border-b border-border-color min-w-max sm:min-w-0">
                                <TabsTrigger
                                  value="activities"
                                  className="px-4 sm:px-8 md:px-12 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs sm:text-sm"
                                >
                                  Activities
                                </TabsTrigger>
                                <TabsTrigger
                                  value="comments"
                                  className="px-4 sm:px-8 md:px-13 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs sm:text-sm"
                                >
                                  Comments
                                </TabsTrigger>
                                <TabsTrigger
                                  value="reviews"
                                  className="px-4 sm:px-8 md:px-13 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs sm:text-sm"
                                >
                                  Reviews
                                </TabsTrigger>
                              </TabsList>
                            </div>
                            <TabsContent
                              value="activities"
                              className="mt-0 pt-3 px-2 pb-3 sm:pt-4 sm:px-4 sm:pb-4"
                            >
                              <ActivityTab taskGuid={taskGUID} />
                            </TabsContent>
                            <TabsContent
                              value="comments"
                              className="mt-0 pt-3 px-2 pb-3 sm:pt-4 sm:px-4 sm:pb-4"
                            >
                              <CommentsTab
                                taskGuid={taskGUID}
                                readOnly={false}
                              />
                            </TabsContent>
                            <TabsContent
                              value="reviews"
                              className="mt-0 pt-3 px-2 pb-3 sm:pt-4 sm:px-4 sm:pb-4"
                            >
                              <ReviewList
                                reviews={task?.reviews}
                                taskGUID={taskGUID}
                                showAddButton={isReviewTaskPage}
                              />
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`w-full xl:w-80 shrink-0 space-y-3 sm:space-y-4 xl:pl-4 xl:border-l border-border-color ${
                    isEditDisabled ? "opacity-60" : ""
                  }`}
                >
                  {mode === "edit" && isReviewTaskPage && (
                    <FormField
                      control={control}
                      name="strStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Status
                            {isReviewTaskPage && (
                              <span className="text-red-500"> *</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={
                                isReviewTaskPage && field.value === "For Review"
                                  ? ""
                                  : field.value
                              }
                              onValueChange={field.onChange}
                              disabled={isEditDisabled}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                {(isReviewTaskPage
                                  ? REVIEW_TASK_STATUS_OPTIONS
                                  : STATUS_OPTIONS
                                ).map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="pl-2 pr-2 [&_svg]:hidden"
                                  >
                                    <span className="flex items-center gap-2">
                                      <span
                                        className={`h-3 w-3 rounded ${
                                          STATUS_COLOR_BOX[option.value]
                                        }`}
                                      />
                                      {option.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {!isMyTaskPage &&
                    (isAssignablePage ||
                      isReviewTaskPage ||
                      statusValue === "Not Started") && (
                      <FormField
                        key={`assigned-${mode}-${taskGUID || "new"}`}
                        control={control}
                        name="assignments"
                        render={({ field }) => {
                          const selectedSectionGUID = watch(
                            "strBoardSectionGUID"
                          );
                          const isDisabled =
                            isEditDisabled ||
                            (mode === "edit" && isPrivateEffective) ||
                            (!isPrivateEffective &&
                              (!selectedBoardGUID || !selectedSectionGUID));
                          const getPlaceholder = () => {
                            if (isPrivateEffective) return "Select user";
                            if (!selectedBoardGUID)
                              return "Select project first";
                            if (!selectedSectionGUID)
                              return "Select section first";
                            return "Select user";
                          };
                          const getTooltipMessage = () => {
                            if (!selectedBoardGUID)
                              return "Please select a project first";
                            if (!selectedSectionGUID)
                              return "Please select a module first";
                            return "";
                          };
                          const assignmentOptions =
                            assignmentType === "TEAM"
                              ? teamOptions
                              : userOptions;
                          const assignmentLoading =
                            assignmentType === "TEAM"
                              ? isLoadingTeams
                              : isLoadingUsers || isLoadingBoardUsers;
                          return (
                            <FormItem className="-mt-1.5">
                              <FormLabel className="text-xs sm:text-sm">
                                {mode === "create"
                                  ? "Assign to"
                                  : "Assigned to"}{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <AssignmentSelect
                                        options={assignmentOptions}
                                        treeData={
                                          assignmentType === "TEAM"
                                            ? teamTreeData
                                            : undefined
                                        }
                                        selectedValues={selectedAssigneeIds}
                                        onChange={(values: string[]) => {
                                          setSelectedAssigneeIds(values);
                                          field.onChange(
                                            values.map((value: string) => ({
                                              strAssignToGUID: value,
                                              strAssignToType: assignmentType,
                                            }))
                                          );
                                          setValue(
                                            "strAssignedToGUID",
                                            assignmentType === "USER"
                                              ? values[0] || ""
                                              : ""
                                          );
                                        }}
                                        typeValue={assignmentType}
                                        onTypeChange={(
                                          value: AssignmentSelectType
                                        ) => {
                                          setAssignmentType(value);
                                          setSelectedAssigneeIds([]);
                                          field.onChange([]);
                                          setValue("strAssignedToGUID", "");
                                        }}
                                        completionRule={completionRule}
                                        onCompletionRuleChange={(
                                          value: CompletionRule
                                        ) => {
                                          setCompletionRule(value);
                                          setValue("strCompletionRule", value);
                                        }}
                                        placeholder={getPlaceholder()}
                                        disabled={isDisabled}
                                        allowOpenWhenDisabled={isEditDisabled}
                                        isLoading={assignmentLoading}
                                        onOpenChange={setAssigneeDropdownOpen}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  {isDisabled &&
                                    !isEditDisabled &&
                                    !isPrivateEffective && (
                                      <TooltipContent side="top">
                                        <p>{getTooltipMessage()}</p>
                                      </TooltipContent>
                                    )}
                                </Tooltip>
                              </FormControl>
                              {submitCount > 0 && <FormMessage />}
                            </FormItem>
                          );
                        }}
                      />
                    )}

                  {!isMyTaskPage &&
                    !(isMyTaskPage || isAssignablePage || isReviewTaskPage) &&
                    watch("strStatus") !== "Not Started" &&
                    task?.strAssignedTo && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Assigned to
                        </Label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border-color rounded-md">
                          <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                            {task.strAssignedTo.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-foreground">
                            {task.strAssignedTo}
                          </span>
                        </div>
                      </div>
                    )}

                  <FormField
                    control={control}
                    name="dtStartDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1 -mt-2.5">
                        <FormLabel className="text-xs sm:text-sm">
                          Start date
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value || startDate}
                            onChange={(d) => {
                              field.onChange(d);
                              setStartDate(d);
                            }}
                            placeholder="Select start date"
                            disabled={
                              isEditDisabled
                                ? true
                                : (date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    if (date < today) {
                                      return true;
                                    }
                                    if (dueDate) {
                                      const dueDateMidnight = new Date(dueDate);
                                      dueDateMidnight.setHours(0, 0, 0, 0);
                                      return date > dueDateMidnight;
                                    }
                                    return false;
                                  }
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Due on</Label>
                    <DatePicker
                      value={dueDate}
                      onChange={setDueDate}
                      placeholder="Select due date"
                      disabled={
                        isEditDisabled
                          ? true
                          : (date) => {
                              const currentStartDate =
                                watch("dtStartDate") || startDate;
                              if (currentStartDate) {
                                const startDateMidnight = new Date(
                                  currentStartDate
                                );
                                startDateMidnight.setHours(0, 0, 0, 0);
                                return date < startDateMidnight;
                              }
                              return false;
                            }
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Reminder</Label>
                    <ReminderPicker
                      value={reminderDate}
                      onChange={setReminderDate}
                      recipient={reminderRecipient}
                      onRecipientChange={setReminderRecipient}
                      placeholder="Set reminder date and time"
                      restrictToMyself={isMyTaskPage}
                      disabled={isEditDisabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">
                      {recurrence ? "This Task will repeat" : "Repeat Task"}
                    </Label>
                    {!recurrence ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRecurrence(true)}
                        disabled={isEditDisabled}
                        className="w-full justify-start items-start h-auto py-2"
                      >
                        <span className="block w-full text-left text-muted-foreground text-xs sm:text-sm">
                          Not set yet
                        </span>
                      </Button>
                    ) : (
                      <div className="rounded-md border border-border-color bg-muted/30 p-2 sm:p-3">
                        <div
                          className="rounded-md p-2 text-xs sm:text-sm leading-snug font-medium"
                          style={{
                            backgroundColor: "#FFF3BF",
                            border: "1px solid #F6E7A8",
                            color: "rgb(17,24,39)",
                          }}
                        >
                          {formatRecurrenceSummary(recurrence)}
                        </div>
                        <div className="mt-2 flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                            onClick={() => setShowRecurrence(true)}
                            disabled={isEditDisabled}
                            title="Edit recurrence"
                            aria-label="Edit recurrence"
                          >
                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-destructive"
                            onClick={() => setShowStopRecurrenceConfirm(true)}
                            disabled={isEditDisabled}
                            title="Delete recurrence"
                            aria-label="Delete recurrence"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={control}
                    name="strPriority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">
                          Priority
                        </FormLabel>
                        <FormControl>
                          <Select
                            key={field.value}
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isEditDisabled}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITY_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className="pl-2 pr-2 [&_svg]:hidden"
                                >
                                  <span className="flex items-center gap-2">
                                    <span
                                      className={`h-3 w-3 rounded ${
                                        PRIORITY_COLOR_CLASS[option.value]
                                      }`}
                                    />
                                    {option.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {!isPrivateEffective && (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border-border-color p-2 sm:p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs sm:text-sm">
                          Ticket Info?
                        </FormLabel>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          Toggle to add Source, Key and URL
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={showTicketInfo}
                          onCheckedChange={(checked) => {
                            setShowTicketInfo(checked);
                            if (!checked) {
                              setValue("strTicketKey", "");
                              setValue("strTicketUrl", "");
                              setValue("strTicketSource", "");
                              form.clearErrors([
                                "strTicketKey",
                                "strTicketUrl",
                                "strTicketSource",
                              ]);
                            }
                          }}
                          disabled={isEditDisabled}
                        />
                      </FormControl>
                    </FormItem>
                  )}

                  {showTicketInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                      <FormField
                        control={control}
                        name="strTicketKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">
                              Ticket Key{" "}
                              {showTicketInfo && (
                                <span className="text-red-500">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter Ticket Key"
                                maxLength={50}
                                {...field}
                                value={field.value || ""}
                                disabled={isEditDisabled}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="strTicketUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">
                              Ticket URL{" "}
                              {showTicketInfo && (
                                <span className="text-red-500">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter Ticket URL"
                                maxLength={500}
                                {...field}
                                value={field.value || ""}
                                disabled={isEditDisabled}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="strTicketSource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">
                              Ticket Source{" "}
                              {showTicketInfo && (
                                <span className="text-red-500">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter Ticket Source"
                                maxLength={50}
                                {...field}
                                value={field.value || ""}
                                disabled={isEditDisabled}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {!isPrivateEffective && (
                    <FormField
                      control={control}
                      name="bolIsReviewReq"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-border-color p-2 sm:p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-xs sm:text-sm">
                              Need to Review?
                            </FormLabel>
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              Task will need review before completion
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (!checked) {
                                  setValue("strReviewedByGUID", null);
                                  form.clearErrors(["strReviewedByGUID"]);
                                }
                              }}
                              disabled={isEditDisabled}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                  {!isPrivateEffective && watch("bolIsReviewReq") && (
                    <FormField
                      control={control}
                      name="strReviewedByGUID"
                      render={({ field }) => {
                        const selectedSectionGUID = watch(
                          "strBoardSectionGUID"
                        );
                        const isReviewerDisabled =
                          isEditDisabled ||
                          !selectedBoardGUID ||
                          !selectedSectionGUID;
                        const getReviewerPlaceholder = () => {
                          if (!selectedBoardGUID) return "Select project first";
                          if (!selectedSectionGUID)
                            return "Select module first";
                          return "Select user";
                        };
                        const reviewerOptions = reviewByOptions;
                        return (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">
                              Reviewed By{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <PreloadedSelectWithAvatar
                                      options={reviewerOptions}
                                      selectedValue={field.value || undefined}
                                      onChange={(value) => {
                                        field.onChange(value);
                                      }}
                                      placeholder={getReviewerPlaceholder()}
                                      disabled={isReviewerDisabled}
                                      isLoading={isLoadingUsers}
                                      onOpenChange={(openState) => {
                                        setReviewedByDropdownOpen(openState);
                                        if (!openState) {
                                          setUserSearchQuery("");
                                        }
                                      }}
                                    />
                                  </div>
                                </TooltipTrigger>
                                {isReviewerDisabled && !isEditDisabled && (
                                  <TooltipContent side="top">
                                    <p>{getReviewerPlaceholder()}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}
                  {!isPrivateEffective && (
                    <FormField
                      control={control}
                      name="bolIsBillable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-border-color p-2 sm:p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-xs sm:text-sm">
                              Billable Task?
                            </FormLabel>
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              Mark this task as billable for client
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  setValue("bolIsTimeTrackingReq", true);
                                } else {
                                  setValue("bolIsTimeTrackingReq", false);
                                  setValue("intEstimatedMinutes", 0);
                                }
                              }}
                              disabled={isEditDisabled}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={control}
                    name="bolIsTimeTrackingReq"
                    render={({ field }) => {
                      const isBillable = watch("bolIsBillable");
                      return (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-border-color p-2 sm:p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-xs sm:text-sm">
                              Time Tracking Required?
                            </FormLabel>
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              Time tracking is mandatory for this task
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={(checked) => {
                                if (isBillable && !checked) {
                                  return;
                                }
                                field.onChange(checked);
                                if (!checked) {
                                  setValue("intEstimatedMinutes", 0);
                                  form.clearErrors(["intEstimatedMinutes"]);
                                }
                              }}
                              disabled={isEditDisabled}
                            />
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />

                  {watch("bolIsTimeTrackingReq") && (
                    <FormField
                      control={control}
                      name="intEstimatedMinutes"
                      render={({ field }) => {
                        const totalMinutes = field.value ?? 0;
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;

                        const handleHoursChange = (inputValue: string) => {
                          const val =
                            inputValue === "" ? 0 : parseInt(inputValue, 10);
                          if (!isNaN(val) && val >= 0) {
                            field.onChange(val * 60 + minutes);
                          }
                        };

                        const handleMinutesChange = (inputValue: string) => {
                          const val =
                            inputValue === "" ? 0 : parseInt(inputValue, 10);
                          if (!isNaN(val) && val >= 0 && val <= 59) {
                            field.onChange(hours * 60 + val);
                          }
                        };

                        return (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">
                              Estimated Time{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <div className="flex items-end gap-2 max-w-37.5">
                              <div className="space-y-1">
                                <Label className="text-[10px] sm:text-xs text-muted-foreground">
                                  Hours
                                </Label>
                                <Input
                                  type="text"
                                  placeholder="00"
                                  defaultValue={
                                    hours > 0
                                      ? hours.toString().padStart(2, "0")
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d+$/.test(val)) {
                                      handleHoursChange(val);
                                    } else {
                                      e.target.value =
                                        hours > 0
                                          ? hours.toString().padStart(2, "0")
                                          : "";
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value;
                                    if (val !== "") {
                                      e.target.value = parseInt(val, 10)
                                        .toString()
                                        .padStart(2, "0");
                                    }
                                  }}
                                  disabled={isEditDisabled}
                                  className="h-9 sm:h-10 w-15 text-center font-medium text-sm"
                                />
                              </div>
                              <span className="text-muted-foreground pb-2">
                                :
                              </span>
                              <div className="space-y-1">
                                <Label className="text-[10px] sm:text-xs text-muted-foreground">
                                  Minutes
                                </Label>
                                <Input
                                  type="text"
                                  placeholder="00"
                                  defaultValue={
                                    minutes > 0
                                      ? minutes.toString().padStart(2, "0")
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (
                                      val === "" ||
                                      (/^\d+$/.test(val) &&
                                        parseInt(val, 10) <= 59)
                                    ) {
                                      handleMinutesChange(val);
                                    } else if (
                                      val !== "" &&
                                      parseInt(val, 10) > 59
                                    ) {
                                      e.target.value = "59";
                                      handleMinutesChange("59");
                                    } else {
                                      e.target.value =
                                        minutes > 0
                                          ? minutes.toString().padStart(2, "0")
                                          : "";
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value;
                                    if (val !== "") {
                                      e.target.value = parseInt(val, 10)
                                        .toString()
                                        .padStart(2, "0");
                                    }
                                  }}
                                  disabled={isEditDisabled}
                                  className="h-9 sm:h-10 w-15 text-center font-medium text-sm"
                                />
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}

                  {!(isMyTaskPage
                    ? privacySelection === "private"
                    : (task?.bolIsPrivate ?? false)) && (
                    <TaskTagsSelector
                      selectedTags={selectedTags}
                      onTagsChange={(tags) => {
                        setSelectedTags(tags);
                        setValue(
                          "strTags",
                          tags.map((tag) => `"${tag}"`).join(",")
                        );
                      }}
                      boardGUID={selectedBoardGUID || boardGUID || ""}
                      disabled={
                        isEditDisabled || !(selectedBoardGUID || boardGUID)
                      }
                      isModalOpen={open}
                      showInfoIcon={!(selectedBoardGUID || boardGUID)}
                    />
                  )}
                </div>
              </div>
            </form>
          </Form>
        )}
      </ModalDialog>

      <DeleteConfirmationDialog
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        isLoading={deleteTaskMutation.isPending}
      />

      <DeleteConfirmationDialog
        title="Unsaved Changes"
        description="You have unsaved changes. Do you want to close the modal without saving?"
        confirmLabel="Yes, Close Without Saving"
        open={showUnsavedChangesConfirm}
        onOpenChange={setShowUnsavedChangesConfirm}
        onConfirm={handleConfirmCloseWithoutSaving}
      />

      <DeleteConfirmationDialog
        title="Stop this Task from recurring"
        description="This Task will no longer be repeated. This will however, not affect Tasks that have been previously created."
        confirmLabel="Stop Repeating"
        open={showStopRecurrenceConfirm}
        onOpenChange={setShowStopRecurrenceConfirm}
        onConfirm={() => {
          setRecurrence(null);
          setShowStopRecurrenceConfirm(false);
        }}
      />

      <TaskRecurrenceModal
        open={showRecurrence}
        onOpenChange={setShowRecurrence}
        recurrence={recurrence}
        onSave={(newRecurrence) => setRecurrence(newRecurrence)}
        startDate={startDate}
        dueDate={dueDate}
      />

      <MoveTaskModal
        open={showMoveTaskDialog}
        onOpenChange={setShowMoveTaskDialog}
        taskGUID={taskGUID || null}
        boards={boards}
        boardSectionsData={boardSections}
        onSuccess={() => {
          setShowMoveTaskDialog(false);
          onOpenChange(false);
        }}
      />

      <DuplicateTaskModal
        open={showDuplicateTaskDialog}
        onOpenChange={setShowDuplicateTaskDialog}
        taskGUID={taskGUID || null}
        boards={boards}
        isPrivate={task?.bolIsPrivate ?? false}
        boardSectionsData={boardSections}
        onSuccess={() => {
          setShowDuplicateTaskDialog(false);
          onOpenChange(false);
        }}
      />

      <BulkCreateTaskModal
        taskGUID={taskGUID || ""}
        open={showBulkCreateModal}
        onOpenChange={setShowBulkCreateModal}
        onSuccess={() => {
          setShowBulkCreateModal(false);
        }}
      />

      <BoardFormModal
        open={showBoardFormModal}
        onOpenChange={setShowBoardFormModal}
        onSuccess={() => {
          void invalidateBoardsForUser();
        }}
      />

      <SectionModal
        open={showSectionModal}
        onOpenChange={setShowSectionModal}
        boardGUID={selectedBoardGUID || boardGUID || ""}
        onSuccess={() => {
          const activeBoardGuid = selectedBoardGUID || boardGUID || "";
          if (!activeBoardGuid) return;
        }}
      />

      <SubModuleModal
        open={showSubModuleModal}
        onOpenChange={setShowSubModuleModal}
        sectionGUID={selectedSectionGUID || ""}
        boardGUID={selectedBoardGUID || boardGUID || ""}
        onSuccess={() => {
          // Refetch sub-modules after creating/updating a sub-module
        }}
      />
    </>
  );
}
