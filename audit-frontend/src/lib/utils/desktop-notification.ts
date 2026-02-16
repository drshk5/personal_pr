class DesktopNotificationService {
  private permissionGranted: boolean = false;

  constructor() {
    this.checkPermission();
  }

  private checkPermission() {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      this.permissionGranted = true;
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== "denied") {
      try {
        const permission = await Notification.requestPermission();
        this.permissionGranted = permission === "granted";
        return this.permissionGranted;
      } catch {
        return false;
      }
    }

    return false;
  }

  public show(options: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: unknown;
    onClick?: () => void;
  }): void {
    if (!this.permissionGranted) {
      return;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/src/assets/logos/neminath.png",
      tag: options.tag,
      badge: options.icon || "/src/assets/logos/neminath.png",
      data: options.data,
      requireInteraction: true,
    });

    notification.onshow = () => {};

    notification.onerror = () => {};

    notification.onclose = () => {};

    if (options.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };
    }

    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  public isPermissionGranted(): boolean {
    return this.permissionGranted;
  }

  public isSupported(): boolean {
    return "Notification" in window;
  }
}

export const desktopNotification = new DesktopNotificationService();
