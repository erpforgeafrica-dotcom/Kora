export type NotificationTopic =
  | "bookings"
  | "payments"
  | "alerts"
  | "promotions"
  | "reviews"
  | "system"
  | "staff"
  | "demand";

export interface NotificationPreference {
  topic: NotificationTopic;
  enabled: boolean;
  channels: ("push" | "email" | "sms")[];
  quietHours?: { start: string; end: string };
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  topic: NotificationTopic;
  type: "info" | "warning" | "critical";
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  isActive: boolean;
  createdAt: Date;
}

export class NotificationService {
  private baseUrl = "/api/notifications";

  async getPreferences(): Promise<NotificationPreference[]> {
    const response = await fetch(`${this.baseUrl}/preferences`);
    if (!response.ok) throw new Error("Failed to get preferences");
    return response.json();
  }

  async updatePreference(
    topic: NotificationTopic,
    preference: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    const response = await fetch(`${this.baseUrl}/preferences/${topic}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preference)
    });
    if (!response.ok) throw new Error("Failed to update preference");
    return response.json();
  }

  async getNotifications(
    topic?: NotificationTopic,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<SystemNotification[]> {
    let url = `${this.baseUrl}?limit=${limit}`;
    if (topic) url += `&topic=${topic}`;
    if (unreadOnly) url += "&unreadOnly=true";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to get notifications");
    return response.json();
  }

  async markAsRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${notificationId}/read`, {
      method: "PATCH"
    });
    if (!response.ok) throw new Error("Failed to mark notification as read");
  }

  async markAllAsRead(topic?: NotificationTopic): Promise<void> {
    const url = topic ? `${this.baseUrl}/read-all?topic=${topic}` : `${this.baseUrl}/read-all`;
    const response = await fetch(url, { method: "PATCH" });
    if (!response.ok) throw new Error("Failed to mark all as read");
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${notificationId}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to delete notification");
  }

  async getUnreadCount(topic?: NotificationTopic): Promise<number> {
    const url = topic ? `${this.baseUrl}/unread-count?topic=${topic}` : `${this.baseUrl}/unread-count`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to get unread count");
    const data = await response.json();
    return data.count;
  }

  async subscribeToPush(subscription: PushSubscription): Promise<NotificationSubscription> {
    const response = await fetch(`${this.baseUrl}/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        p256dh: subscription.getKey("p256dh"),
        auth: subscription.getKey("auth")
      })
    });
    if (!response.ok) throw new Error("Failed to subscribe to push");
    return response.json();
  }

  async unsubscribeFromPush(subscriptionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/push/unsubscribe/${subscriptionId}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to unsubscribe from push");
  }

  async testNotification(topic: NotificationTopic): Promise<void> {
    const response = await fetch(`${this.baseUrl}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic })
    });
    if (!response.ok) throw new Error("Failed to send test notification");
  }

  async getNotificationStats(): Promise<{
    totalCount: number;
    unreadCount: number;
    byTopic: Record<NotificationTopic, number>;
  }> {
    const response = await fetch(`${this.baseUrl}/stats`);
    if (!response.ok) throw new Error("Failed to get stats");
    return response.json();
  }

  // WebSocket subscription for real-time notifications (optional)
  subscribeToRealTime(
    onNotification: (notification: SystemNotification) => void,
    onError?: (error: Error) => void
  ): () => void {
    // This is a placeholder for WebSocket implementation
    // In a real app, this would establish a WebSocket connection
    return () => {
      // Cleanup function
    };
  }
}

export const notificationService = new NotificationService();
