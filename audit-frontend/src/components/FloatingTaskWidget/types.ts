/**
 * Type definitions for FloatingTaskWidget component
 */

export interface Position {
  x: number;
  y: number;
}

export interface DragConstraints {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface FloatingTaskWidgetProps {
  /**
   * Callback function triggered when the close button is clicked
   */
  onClose?: () => void;

  /**
   * Initial minimized state of the widget
   * Note: This will be overridden by saved state in localStorage if available
   * @default false
   */
  initialMinimized?: boolean;
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

/**
 * Storage keys used by the widget
 */
export const STORAGE_KEYS = {
  POSITION: "floating-task-widget-position",
  MINIMIZED: "floating-task-widget-minimized",
  TASKS: "floating-task-widget-tasks",
} as const;

/**
 * Default configuration values
 */
export const WIDGET_DEFAULTS = {
  WIDTH: 380,
  HEIGHT_EXPANDED: 500,
  HEIGHT_MINIMIZED: 60,
  DEFAULT_X_OFFSET: 420,
  DEFAULT_Y_OFFSET: 520,
  Z_INDEX: 9999,
} as const;
