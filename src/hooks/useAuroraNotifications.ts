"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook for managing browser notifications for aurora alerts
 *
 * Uses the browser Notification API to send desktop notifications
 * for chase reminders and aurora alerts.
 */

interface UseAuroraNotificationsReturn {
  /** Current notification permission status */
  permission: NotificationPermission;
  /** Whether notifications are supported in this browser */
  isSupported: boolean;
  /** Request permission to send notifications */
  requestPermission: () => Promise<NotificationPermission>;
  /** Schedule a notification to be sent after a delay */
  scheduleReminder: (title: string, body: string, delayMs: number) => number | null;
  /** Cancel a scheduled reminder */
  cancelReminder: (timeoutId: number) => void;
  /** Send an immediate notification */
  notify: (title: string, body: string, options?: NotificationOptions) => Notification | null;
}

export function useAuroraNotifications(): UseAuroraNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  // Check support and current permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  /**
   * Request permission to send notifications
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn("Notifications not supported in this browser");
      return "denied";
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  }, [isSupported]);

  /**
   * Send an immediate notification
   */
  const notify = useCallback(
    (title: string, body: string, options?: NotificationOptions): Notification | null => {
      if (!isSupported || permission !== "granted") {
        console.warn("Cannot send notification: not supported or permission not granted");
        return null;
      }

      try {
        const notification = new Notification(title, {
          body,
          icon: "/logo.png",
          badge: "/logo.png",
          tag: "aurora-alert",
          ...options,
        } as NotificationOptions);

        // Auto-close after 10 seconds
        setTimeout(() => notification.close(), 10000);

        return notification;
      } catch (error) {
        console.error("Error sending notification:", error);
        return null;
      }
    },
    [isSupported, permission]
  );

  /**
   * Schedule a notification to be sent after a delay
   * Returns the timeout ID for cancellation
   */
  const scheduleReminder = useCallback(
    (title: string, body: string, delayMs: number): number | null => {
      if (!isSupported) {
        console.warn("Notifications not supported");
        return null;
      }

      if (permission !== "granted") {
        console.warn("Notification permission not granted");
        return null;
      }

      if (delayMs <= 0) {
        // Send immediately if delay is 0 or negative
        notify(title, body, { tag: "aurora-chase-reminder" });
        return null;
      }

      const timeoutId = window.setTimeout(() => {
        notify(title, body, { tag: "aurora-chase-reminder" });
      }, delayMs);

      return timeoutId;
    },
    [isSupported, permission, notify]
  );

  /**
   * Cancel a scheduled reminder
   */
  const cancelReminder = useCallback((timeoutId: number): void => {
    window.clearTimeout(timeoutId);
  }, []);

  return {
    permission,
    isSupported,
    requestPermission,
    scheduleReminder,
    cancelReminder,
    notify,
  };
}

/**
 * Helper hook to check if aurora notifications are available
 */
export function useCanNotify(): boolean {
  const { isSupported, permission } = useAuroraNotifications();
  return isSupported && permission === "granted";
}

export default useAuroraNotifications;
