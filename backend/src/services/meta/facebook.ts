import { queryDb } from "../../db/client.js";

interface FacebookPagePost {
  id: string;
  created_time: string;
  message?: string;
  story?: string;
  permalink_url: string;
  type: string;
  status_type?: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
}

interface FacebookPageInsights {
  daily_average_post_reach_organic: number;
  daily_average_post_reach_paid: number;
  daily_average_post_engagement: number;
  page_fans: number;
  page_fans_online: number;
}

class FacebookService {
  private baseUrl = "https://graph.facebook.com/v18.0";
  private accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error("Facebook access token is required");
    }
    this.accessToken = accessToken;
  }

  /**
   * Get Facebook page info
   */
  async getPageInfo(pageId: string) {
    const fields = [
      "id",
      "name",
      "about",
      "description",
      "category",
      "website",
      "phone",
      "picture.width(200).height(200)",
      "cover.width(500).height(260)",
      "followers_count",
      "talking_about_count"
    ].join(",");

    const params = new URLSearchParams({
      fields,
      access_token: this.accessToken
    });

    const response = await fetch(`${this.baseUrl}/${pageId}?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Facebook page info: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get Facebook page posts
   */
  async getPagePosts(pageId: string, limit: number = 25): Promise<FacebookPagePost[]> {
    const fields = [
      "id",
      "created_time",
      "message",
      "story",
      "permalink_url",
      "type",
      "status_type",
      "likes.summary(true).limit(0)",
      "comments.summary(true).limit(0)",
      "shares"
    ].join(",");

    const params = new URLSearchParams({
      fields,
      access_token: this.accessToken,
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}/${pageId}/posts?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Facebook posts: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.data || []).map((post: any) => ({
      ...post,
      likes_count: post.likes?.summary?.total_count,
      comments_count: post.comments?.summary?.total_count,
      shares_count: post.shares?.count
    }));
  }

  /**
   * Create Facebook page post
   */
  async createPost(
    pageId: string,
    message: string,
    mediaUrls: string[] = [],
    scheduledTime?: Date
  ): Promise<{ id: string; status: string }> {
    const payload: Record<string, any> = {
      message,
      access_token: this.accessToken
    };

    if (scheduledTime) {
      payload.published = false;
      payload.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000);
    }

    // If media provided, attach first image
    if (mediaUrls.length > 0) {
      payload.link = mediaUrls[0];
    }

    const response = await fetch(`${this.baseUrl}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create Facebook post: ${error.error?.message}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: scheduledTime ? "scheduled" : "published"
    };
  }

  /**
   * Get page insights
   */
  async getPageInsights(
    pageId: string,
    metrics: string[] = [
      "daily_average_post_reach_organic",
      "daily_average_post_reach_paid",
      "daily_average_post_engagement",
      "page_fans",
      "page_fans_online"
    ]
  ): Promise<FacebookPageInsights> {
    const params = new URLSearchParams({
      metric: metrics.join(","),
      period: "day",
      access_token: this.accessToken
    });

    const response = await fetch(`${this.baseUrl}/${pageId}/insights?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Facebook insights: ${response.statusText}`);
    }

    const data = await response.json();
    const insights: Record<string, number> = {};

    (data.data || []).forEach((item: any) => {
      insights[item.name] = item.values?.[0]?.value || 0;
    });

    return {
      daily_average_post_reach_organic: insights.daily_average_post_reach_organic || 0,
      daily_average_post_reach_paid: insights.daily_average_post_reach_paid || 0,
      daily_average_post_engagement: insights.daily_average_post_engagement || 0,
      page_fans: insights.page_fans || 0,
      page_fans_online: insights.page_fans_online || 0
    };
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<{ success: boolean }> {
    const params = new URLSearchParams({
      access_token: this.accessToken
    });

    const response = await fetch(`${this.baseUrl}/${postId}?${params.toString()}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete Facebook post: ${response.statusText}`);
    }

    return { success: true };
  }

  /**
   * Get page comments
   */
  async getPageComments(pageId: string, limit: number = 50) {
    const fields = ["id", "from", "message", "created_time", "user_likes.summary(true).limit(0)"].join(",");

    const params = new URLSearchParams({
      fields,
      access_token: this.accessToken,
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}/${pageId}/comments?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page comments: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Reply to comment
   */
  async replyToComment(commentId: string, message: string): Promise<{ id: string }> {
    const payload = {
      message,
      access_token: this.accessToken
    };

    const response = await fetch(`${this.baseUrl}/${commentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to reply to comment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Store scheduled post in database
   */
  async storeScheduledPost(
    organizationId: string,
    pageId: string,
    facebookPostId: string,
    message: string,
    mediaUrls: string[],
    scheduledTime: Date
  ) {
    await queryDb(
      `INSERT INTO facebook_scheduled_posts 
       (org_id, page_id, facebook_post_id, message, media_urls, scheduled_at, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', NOW())`,
      [organizationId, pageId, facebookPostId, message, JSON.stringify(mediaUrls), scheduledTime]
    );
  }

  /**
   * Get scheduled posts
   */
  async getScheduledPosts(organizationId: string) {
    const posts = await queryDb(
      `SELECT id, page_id, facebook_post_id, message, media_urls, scheduled_at, status
       FROM facebook_scheduled_posts
       WHERE org_id = $1 AND status = 'scheduled'
       ORDER BY scheduled_at ASC`,
      [organizationId]
    );

    return posts;
  }

  /**
   * Handle Facebook webhook
   */
  async handleWebhook(payload: any) {
    const event = payload;

    if (event.object === "page") {
      const entry = event.entry[0];

      if (entry.messaging) {
        for (const message of entry.messaging) {
          if (message.message) {
            await this.handleIncomingMessage(message);
          }
        }
      }
    }
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(message: any) {
    console.log("New Facebook message:", message);
    // TODO: Store in message inbox
  }
}

export default FacebookService;
