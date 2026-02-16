import { useEffect, useState, useCallback } from "react";
import "./FloatingTaskWidget.css";
import { useNavigate } from "react-router-dom";
import { getPriorityColor } from "@/lib/task/task";
import { useGetActiveSession } from "@/hooks/api/task/use-task-timer";

// Type for task object that can be either Task or UserTaskInfo
type DisplayTask = Record<string, unknown> & {
  strTaskTitle?: string;
  strTitle?: string;
  strBoardName?: string;
  strBoardSection?: string;
  strPriority?: string;
};

interface FloatingTaskWidgetProps {
  onClose?: () => void;
}

const getTaskTitle = (task: DisplayTask | null): string => {
  if (!task) return "Untitled Task";
  return (task.strTaskTitle || task.strTitle || "Untitled Task") as string;
};

const getBoardSection = (task: DisplayTask | null): string => {
  if (!task) return "";
  return (task.strBoardSection || "") as string;
};

export const FloatingTaskWidget: React.FC<FloatingTaskWidgetProps> = ({
  onClose,
}) => {
  const navigate = useNavigate();
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [manuallyOpenedTask, setManuallyOpenedTask] =
    useState<DisplayTask | null>(null);
  const [currentTask, setCurrentTask] = useState<DisplayTask | null>(null);
  const [isLoadingPiP, setIsLoadingPiP] = useState(false);
  const [isWidgetActive, setIsWidgetActive] = useState(false);

  // Fetch current task info from API using the timer hook
  const { data: sessionData, refetch: refetchActiveSession } =
    useGetActiveSession({ enabled: isWidgetActive });
  const [fetchTimestamp, setFetchTimestamp] = useState<number>(Date.now());

  // Update state whenever session data changes
  useEffect(() => {
    if (sessionData) {
      // Map ActiveSessionResponse to DisplayTask
      const taskInfo: DisplayTask | null = sessionData
        ? {
            strTaskTitle: sessionData?.strTitle || "Untitled Task",
            strBoardName: sessionData?.strBoardName || undefined,
            strBoardSection: sessionData?.strBoardSectionName || undefined,
            strPriority: sessionData?.strPriority || undefined,
          }
        : null;
      setCurrentTask(taskInfo);
      setFetchTimestamp(Date.now()); // Record when we fetched
      console.log("✅ Fetched current task from API:", taskInfo);
      console.log("✅ Initial time from API:", sessionData?.strTotalTimeWorked);
    }
  }, [sessionData]);

  // Helper to calculate current time based on initial fetch + elapsed real time
  const getCurrentDisplayTime = useCallback(
    (
      sessionOverride?: { strTotalTimeWorked?: string },
      timestampOverride?: number
    ): string => {
      const effectiveSession = sessionOverride || sessionData;
      if (!effectiveSession?.strTotalTimeWorked) return "00:00:00";

      // Parse initial time
      const parts = effectiveSession.strTotalTimeWorked.split(":");
      let h = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      let s = parseInt(parts[2], 10);

      // Add elapsed seconds since fetch
      const baseTimestamp = timestampOverride ?? fetchTimestamp;
      const elapsedMs = Date.now() - baseTimestamp;
      const elapsedSecs = Math.floor(elapsedMs / 1000);

      s += elapsedSecs;
      if (s >= 60) {
        m += Math.floor(s / 60);
        s = s % 60;
        if (m >= 60) {
          h += Math.floor(m / 60);
          m = m % 60;
        }
      }

      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    },
    [sessionData, fetchTimestamp]
  );

  // Document Picture-in-Picture: pop-out mini window that stays on top
  // Type-safe access to Document Picture-in-Picture API
  interface DocumentPiP {
    requestWindow(options?: {
      width?: number;
      height?: number;
    }): Promise<Window>;
  }
  const docPiP: DocumentPiP | undefined = (
    window as unknown as { documentPictureInPicture?: DocumentPiP }
  ).documentPictureInPicture;
  const supportsPiP = !!docPiP;

  // Log PiP support for debugging
  useEffect(() => {
    console.log(
      "� Task Widget initialized:",
      currentTask?.strTaskTitle || "No task"
    );
  }, [currentTask?.strTaskTitle]);

  // Derive theme colors from CSS variables (fallbacks provided)
  const getTheme = useCallback(() => {
    const root = document.documentElement;
    const css = getComputedStyle(root);
    const getVar = (name: string, fallback: string) =>
      css.getPropertyValue(name).trim() || fallback;
    return {
      bg: getVar("--background", "#ffffff"),
      fg: getVar("--foreground", "#111827"),
      muted: getVar("--muted", "#f3f4f6"),
      border: getVar("--border", "#e5e7eb"),
      primary: getVar("--primary", "#667eea"),
      primaryFg: getVar("--primary-foreground", "#ffffff"),
      warning: "#f59e0b",
      info: "#3b82f6",
      success: "#10b981",
      cardShadow: "0 8px 28px rgba(0,0,0,0.12)",
      radius: "12px",
    };
  }, []);

  // Render content inside PiP window according to theme and current task
  const renderPiP = useCallback(
    (pip: Window, totalTime: string = "00:00:00", taskToRender?: unknown) => {
      const taskForRendering = (taskToRender ||
        currentTask) as DisplayTask | null;
      if (!taskForRendering) return;
      const theme = getTheme();
      const doc = pip.document;
      doc.body.style.margin = "0";
      doc.body.style.padding = "0";
      doc.body.style.fontFamily =
        "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      doc.body.style.background = theme.bg;
      doc.body.style.height = "100%";
      doc.body.style.overflow = "hidden";

      // Priority color using the same approach as MyTask list
      const priorityColor = getPriorityColor(
        taskForRendering.strPriority || "None"
      );

      // Lucide-style SVG icons
      const clipboardIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
      const timerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l3 2"></path><path d="M9 2h6"></path></svg>`;
      const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;

      // Add shared styles via style tag
      const styleTag = doc.createElement("style");
      styleTag.textContent = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { 
        height: 100vh; 
        width: 100vw;
        display: flex; 
        align-items: center; 
        padding: 0;
        margin: 0;
        background: ${theme.bg};
        overflow: hidden;
        -webkit-app-region: drag;
        border: none;
        outline: none;
      }
      #pip-container {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 10px;
        color: ${theme.fg};
        background: linear-gradient(135deg, ${theme.bg} 0%, ${theme.muted} 100%);
        border-left: 3px solid ${priorityColor};
        -webkit-app-region: no-drag;
        border: none;
        outline: none;
      }
      #task-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      #task-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: ${theme.fg};
      }
      #task-title svg {
        flex-shrink: 0;
        color: ${theme.primary};
      }
      #task-title-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #task-meta {
        font-size: 10px;
        color: ${theme.fg};
        display: flex;
        gap: 6px;
        white-space: nowrap;
        overflow: hidden;
        align-items: center;
        opacity: 0.8;
      }
      #task-meta > span:nth-child(2) {
        color: ${theme.primary};
        opacity: 0.6;
        font-weight: 700;
      }
      #status-badge {
        display: inline-block;
        width: 3px;
        height: 100%;
        background: ${priorityColor};
        border-radius: 2px;
        margin-right: 8px;
        flex-shrink: 0;
      }
      #timer-section {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(${parseInt(theme.primary.slice(1, 3), 16)}, ${parseInt(theme.primary.slice(3, 5), 16)}, ${parseInt(theme.primary.slice(5, 7), 16)}, 0.1);
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid ${theme.primary}40;
      }
      #timer-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: ${theme.primary};
      }
      #timer-icon svg {
        width: 14px;
        height: 14px;
      }
      #pip-elapsed {
        font-family: 'Courier New', monospace;
        font-weight: 700;
        font-size: 13px;
        color: ${theme.primary};
        letter-spacing: 0.5px;
        min-width: 42px;
      }
      #pip-view {
        padding: 5px 10px;
        background: ${theme.primary};
        color: ${theme.primaryFg};
        border: none;
        border-radius: 5px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      #pip-view span {
        color: white;
      }
      #pip-view svg {
        width: 12px;
        height: 12px;
        color: white;
        fill: white;
      }
      #pip-view:hover {
        background: ${theme.primary}dd;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        transform: translateY(-1px);
      }
      #pip-view:active {
        transform: translateY(0);
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      }
    `;
      doc.head.appendChild(styleTag);

      doc.body.innerHTML = `
      <div id="pip-container">
        <!-- Vertical Status Badge -->
        <div id="status-badge"></div>
        
        <!-- Left: Task Info & Meta -->
        <div id="task-info">
          <div id="task-title" title="${getTaskTitle(taskForRendering)}">
            ${clipboardIcon}
            <span id="task-title-text">${getTaskTitle(taskForRendering)}</span>
          </div>
          <div id="task-meta">
            <span>${taskForRendering.strBoardName || ""}</span>
            <span></span>
            <span>${getBoardSection(taskForRendering)}</span>
          </div>
        </div>

        <!-- Center: Timer -->
        <div id="timer-section">
          <div id="timer-icon">${timerIcon}</div>
          <span id="pip-elapsed">${totalTime}</span>
        </div>
        
        <!-- Right: Button -->
        <button id="pip-view">${playIcon}<span>Open</span></button>
      </div>
    `;

      // Wire action with proper error handling and window focus
      const viewBtn = doc.getElementById("pip-view");
      if (viewBtn) {
        viewBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("🔗 Opening /mytask and bringing window to focus");

          // Focus the main window
          try {
            window.focus();
            window.parent.focus();
          } catch (err) {
            console.debug("Could not focus window:", err);
          }

          // Navigate to /mytask
          navigate("/mytask");
        });
      } else {
        console.warn("❌ pip-view button not found");
      }
    },
    [currentTask, getTheme, navigate]
  );

  const openPiP = useCallback(
    async (taskOverride?: unknown) => {
      // Prevent multiple clicks
      if (isLoadingPiP) {
        console.log("⏳ Already loading PiP, ignoring click");
        return;
      }

      const taskToUse = (taskOverride || currentTask) as DisplayTask | null;
      console.log("\n🔵 BUTTON CLICKED - openPiP called");
      console.log("📊 Checking conditions:");
      console.log("  - supportsPiP:", supportsPiP);
      console.log("  - taskToUse:", getTaskTitle(taskToUse || {}));
      console.log("  - docPiP:", !!docPiP);

      if (!supportsPiP) {
        console.warn("❌ Document PiP not supported in this browser");
        return;
      }
      if (!taskToUse) {
        console.warn("❌ No current task to show in PiP");
        return;
      }
      if (!docPiP) {
        console.warn("❌ docPiP is undefined");
        return;
      }

      setIsWidgetActive(true);
      setIsLoadingPiP(true);
      // Dispatch event to notify UI of loading state
      window.dispatchEvent(
        new CustomEvent("pip-loading-state", { detail: { isLoading: true } })
      );

      console.log("🚀 All conditions met! Opening PiP window...");
      try {
        let activeSession = sessionData;
        let activeSessionFetchTime = fetchTimestamp;

        if (!activeSession) {
          const fetchTime = Date.now();
          const sessionResult = await refetchActiveSession();
          activeSession = sessionResult.data;
          activeSessionFetchTime = fetchTime;
          if (activeSession) {
            setFetchTimestamp(fetchTime);
          }
        }

        // Open PiP window with minimal chrome - 360x52
        const pip: Window = await docPiP.requestWindow({
          width: 360,
          height: 52,
        });
        console.log("✅ PiP window opened successfully");
        setPipWindow(pip);

        setManuallyOpenedTask(taskToUse);

        // Get initial display time and render
        const displayTime = getCurrentDisplayTime(
          activeSession,
          activeSessionFetchTime
        );
        renderPiP(pip, displayTime, taskToUse);

        // Update display every 100ms to stay smooth and in sync
        const interval = setInterval(() => {
          const currentDisplayTime = getCurrentDisplayTime();
          const el = pip.document.getElementById("pip-elapsed");
          if (el) el.textContent = currentDisplayTime;
        }, 100);

        pip.addEventListener("unload", () => {
          console.log("🔒 PiP window closed by user");
          clearInterval(interval);
          setPipWindow(null);
          setManuallyOpenedTask(null);
          setIsWidgetActive(false);
          window.dispatchEvent(new CustomEvent("pip-closed"));
        });

        setIsLoadingPiP(false);
        window.dispatchEvent(
          new CustomEvent("pip-loading-state", { detail: { isLoading: false } })
        );
      } catch (e) {
        console.error("❌ Failed to open Document PiP window", e);
        setIsLoadingPiP(false);
        setIsWidgetActive(false);
        window.dispatchEvent(
          new CustomEvent("pip-loading-state", { detail: { isLoading: false } })
        );
      }
    },
    [
      supportsPiP,
      currentTask,
      docPiP,
      renderPiP,
      isLoadingPiP,
      getCurrentDisplayTime,
      sessionData,
      fetchTimestamp,
      refetchActiveSession,
    ]
  );

  // Close PiP automatically when there is no running task
  // But only if it wasn't manually opened by the user
  useEffect(() => {
    if (!currentTask && pipWindow && !manuallyOpenedTask) {
      try {
        pipWindow.close();
      } catch {
        console.debug("PiP close failed");
      }
      setPipWindow(null);
      setIsWidgetActive(false);
    }
  }, [currentTask, pipWindow, manuallyOpenedTask]);

  // No visibility-based auto-open - user clicks button to open PiP

  // Re-render PiP when task details change
  useEffect(() => {
    if (pipWindow && currentTask) {
      console.log("🔄 Re-rendering PiP with updated task data");
      renderPiP(pipWindow);
    }
  }, [pipWindow, currentTask, renderPiP]);

  // Ensure PiP closes if the component is unmounted
  useEffect(() => {
    return () => {
      if (pipWindow) {
        try {
          pipWindow.close();
        } catch {
          console.debug("PiP close failed");
        }
      }
      if (onClose) onClose();
      setIsWidgetActive(false);
    };
  }, [pipWindow, onClose]);

  // Listen for PiP open event from MyTask component
  useEffect(() => {
    const handleOpenPiP = (event: Event) => {
      const customEvent = event as CustomEvent;
      const taskFromEvent = customEvent.detail;
      console.log(
        "🖱️ PiP button clicked from MyTask with task:",
        taskFromEvent?.strTaskTitle
      );

      // Call openPiP directly with the task from event
      if (taskFromEvent) {
        openPiP(taskFromEvent);
      } else {
        console.warn("❌ No task available in PiP event");
      }
    };

    window.addEventListener("open-pip", handleOpenPiP);
    return () => window.removeEventListener("open-pip", handleOpenPiP);
  }, [openPiP]);

  // Listen for PiP close event (e.g., when task status changes)
  useEffect(() => {
    const handleClosePiP = (event: Event) => {
      const customEvent = event as CustomEvent;
      const taskGUID = customEvent.detail?.taskGUID;
      console.log("🔴 Close PiP event received for task:", taskGUID);

      if (pipWindow) {
        try {
          pipWindow.close();
          setPipWindow(null);
          setManuallyOpenedTask(null);
          setIsWidgetActive(false);
          // Notify that PiP was closed
          window.dispatchEvent(new CustomEvent("pip-closed"));
        } catch (e) {
          console.debug("PiP close failed:", e);
        }
      }
    };

    window.addEventListener("close-pip", handleClosePiP);
    return () => window.removeEventListener("close-pip", handleClosePiP);
  }, [pipWindow]);

  if (!currentTask) return null;

  return null;
};

export default FloatingTaskWidget;
