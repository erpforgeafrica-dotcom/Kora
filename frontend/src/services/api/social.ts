export type SocialPlatform = "whatsapp" | "instagram" | "facebook" | "tiktok" | "pinterest" | "snapchat" | "twitter";

export interface SocialAccount {
  platform: SocialPlatform;
  accountId: string;
  username: string;
  displayName: string;
  profileImageUrl: string;
  isConnected: boolean;
  connectedAt: Date;
  followers?: number;
  engagement?: number;
}

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  scheduledTime?: Date;
  publishedAt?: Date;
  status: "draft" | "scheduled" | "published" | "failed";
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

export interface SocialMessage {
  id: string;
  platform: SocialPlatform;
  from: string;
  content: string;
  receivedAt: Date;
  isRead: boolean;
  reply?: string;
}

export interface SocialAnalytics {
  platform: SocialPlatform;
  period: "day" | "week" | "month";
  followers: number;
  posts: number;
  engagement: number;
  reach: number;
  impressions: number;
  topPost?: SocialPost;
}

export class SocialService {
  private baseUrl = "/api/social";

  async connectAccount(platform: SocialPlatform, authCode: string): Promise<SocialAccount> {
    const response = await fetch(`${this.baseUrl}/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, authCode })
    });
    if (!response.ok) throw new Error(`Failed to connect ${platform}`);
    return response.json();
  }

  async getAccounts(): Promise<SocialAccount[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error("Failed to get accounts");
    return response.json();
  }

  async getAccount(platform: SocialPlatform): Promise<SocialAccount> {
    const response = await fetch(`${this.baseUrl}/${platform}`);
    if (!response.ok) throw new Error(`Failed to get ${platform} account`);
    return response.json();
  }

  async disconnectAccount(platform: SocialPlatform): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${platform}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error(`Failed to disconnect ${platform}`);
  }

  async publishPost(
    platforms: SocialPlatform[],
    content: string,
    mediaUrls?: string[],
    scheduleTime?: Date
  ): Promise<SocialPost[]> {
    const response = await fetch(`${this.baseUrl}/post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platforms,
        content,
        mediaUrls,
        scheduledTime: scheduleTime
      })
    });
    if (!response.ok) throw new Error("Failed to publish post");
    return response.json();
  }

  async getMessages(platform?: SocialPlatform): Promise<SocialMessage[]> {
    const url = platform ? `${this.baseUrl}/messages?platform=${platform}` : `${this.baseUrl}/messages`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to get messages");
    return response.json();
  }

  async replyToMessage(messageId: string, replyContent: string): Promise<SocialMessage> {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: replyContent })
    });
    if (!response.ok) throw new Error("Failed to send reply");
    return response.json();
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}/read`, {
      method: "PATCH"
    });
    if (!response.ok) throw new Error("Failed to mark message as read");
  }

  async getAnalytics(platform: SocialPlatform, period: "day" | "week" | "month"): Promise<SocialAnalytics> {
    const response = await fetch(`${this.baseUrl}/${platform}/analytics?period=${period}`);
    if (!response.ok) throw new Error("Failed to get analytics");
    return response.json();
  }

  async getPosts(
    platform?: SocialPlatform,
    limit: number = 10
  ): Promise<SocialPost[]> {
    const url = platform
      ? `${this.baseUrl}/posts?platform=${platform}&limit=${limit}`
      : `${this.baseUrl}/posts?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to get posts");
    return response.json();
  }

  async deletePost(postId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to delete post");
  }

  async editPost(postId: string, content: string, mediaUrls?: string[]): Promise<SocialPost> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, mediaUrls })
    });
    if (!response.ok) throw new Error("Failed to edit post");
    return response.json();
  }

  async schedulePost(
    platforms: SocialPlatform[],
    content: string,
    scheduleTime: Date,
    mediaUrls?: string[]
  ): Promise<SocialPost[]> {
    return this.publishPost(platforms, content, mediaUrls, scheduleTime);
  }

  async getUnreadMessageCount(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/messages/unread/count`);
    if (!response.ok) throw new Error("Failed to get unread count");
    const data = await response.json();
    return data.count;
  }
}

export const socialService = new SocialService();
