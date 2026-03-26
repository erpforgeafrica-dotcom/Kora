import { queryDb } from "../../db/client.js";

interface InstagramMediaItem {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL";
  media_url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  insights?: {
    impressions: number;
    reach: number;
    engagement: number;
  };
}

interface InstagramBusinessAccount {
  id: string;
  username: string;
  name: string;
  biography: string;
  website: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url: string;
}

class InstagramService {
  private baseUrl = "https://graph.instagram.com/v18.0";
  private accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error("Instagram access token is required");
    }
    this.accessToken = accessToken;
  }

  /**
   * Get Instagram Business Account info
   */
  async getBusinessAccount(instagramBusinessAccountId: string): Promise<InstagramBusinessAccount> {
    const fields = [
      "id",
      "username",
      "name",
      "biography",
      "website",
      "followers_count",
      "follows_count",
      "media_count",
      "profile_picture_url"
    ].join(",");

    const params = new URLSearchParams({
      fields,
      access_token: this.accessToken
    });

    const response = await fetch(`${this.baseUrl}/${instagramBusinessAccountId}?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram business account: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get Instagram media
   */
  async getMedia(instagramBusinessAccountId: string, limit: number = 25): Promise<InstagramMediaItem[]> {
    const fields = ["id", "media_type", "media_url", "permalink", "caption", "timestamp", "like_count", "comments_count"].join(
      ","
    );

    const params = new URLSearchParams({
      fields,
      access_token: this.accessToken,
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}/${instagramBusinessAccountId}/media?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram media: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get insights for media
   */
  async getMediaInsights(mediaId: string): Promise<{ impressions: number; reach: number; engagement: number }> {
    const fields = "impressions,reach,engagement";

    const params = new URLSearchParams({
      fields,
      access_token: this.accessToken
    });

    const response = await fetch(`${this.baseUrl}/${mediaId}/insights?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      // If insights not available, return zeros
      return { impressions: 0, reach: 0, engagement: 0 };
    }

    const data = await response.json();
    const insights: Record<string, any> = {};

    (data.data || []).forEach((item: any) => {
      insights[item.name] = item.values[0]?.value || 0;
    });

    return {
      impressions: insights.impressions || 0,
      reach: insights.reach || 0,
      engagement: insights.engagement || 0
    };
  }

  /**
   * Schedule Instagram post (carousel or single image)
   */
  async schedulePost(
    instagramBusinessAccountId: string,
    mediaUrls: string[],
    caption: string,
    scheduledTime: Date
  ): Promise<{ id: string; status: string }> {
    // Instagram requires media to be uploaded first
    const uploadedMedia = [];

    for (const mediaUrl of mediaUrls) {
      const mediaId = await this.uploadMedia(instagramBusinessAccountId, mediaUrl);
      uploadedMedia.push(mediaId);
    }

    // Create carousel or single media
    const payload: Record<string, any> = {
      caption,
      publish_time: Math.floor(scheduledTime.getTime() / 1000),
      access_token: this.accessToken
    };

    let endpoint = `${this.baseUrl}/${instagramBusinessAccountId}/media`;

    if (uploadedMedia.length === 1) {
      payload.image_url = mediaUrls[0];
    } else {
      payload.media_type = "CAROUSEL";
      payload.children = uploadedMedia;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule Instagram post: ${response.statusText}`);
    }

    const data = await response.json();
    return { id: data.id, status: "scheduled" };
  }

  /**
   * Upload media to Instagram (internal helper)
   */
  private async uploadMedia(instagramBusinessAccountId: string, mediaUrl: string): Promise<string> {
    const payload = {
      image_url: mediaUrl,
      access_token: this.accessToken
    };

    const response = await fetch(`${this.baseUrl}/${instagramBusinessAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to upload media: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Publish scheduled post
   */
  async publishPost(mediaId: string): Promise<{ success: boolean }> {
    const payload = {
      publish: true,
      access_token: this.accessToken
    };

    const response = await fetch(`${this.baseUrl}/${mediaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to publish Instagram post: ${response.statusText}`);
    }

    return { success: true };
  }

  /**
   * Get pending approval posts
   */
  async getPendingApprovalPosts(organizationId: string): Promise<any[]> {
    const posts = await queryDb(
      `SELECT id, content, platforms, media_urls, status, scheduled_at, created_at, created_by
       FROM social_posts
       WHERE org_id = $1 AND platforms LIKE '%instagram%' AND status = 'pending_approval'
       ORDER BY created_at DESC`,
      [organizationId]
    );

    return posts;
  }

  /**
   * Store scheduled media in database
   */
  async storeScheduledMedia(
    organizationId: string,
    instagramAccountId: string,
    mediaId: string,
    mediaUrls: string[],
    caption: string,
    scheduledTime: Date
  ) {
    await queryDb(
      `INSERT INTO instagram_scheduled_media 
       (org_id, account_id, media_id, media_urls, caption, scheduled_at, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', NOW())`,
      [organizationId, instagramAccountId, mediaId, JSON.stringify(mediaUrls), caption, scheduledTime]
    );
  }

  /**
   * Get scheduled media for organization
   */
  async getScheduledMedia(organizationId: string) {
    const scheduled = await queryDb(
      `SELECT id, account_id, media_id, media_urls, caption, scheduled_at, status, created_at
       FROM instagram_scheduled_media
       WHERE org_id = $1 AND status = 'scheduled'
       ORDER BY scheduled_at ASC`,
      [organizationId]
    );

    return scheduled;
  }

  /**
   * Handle Instagram webhook events
   */
  async handleWebhook(payload: any) {
    const event = payload;

    // Handle different webhook events
    if (event.object === "instagram") {
      const entry = event.entry[0];

      if (entry.changes) {
        for (const change of entry.changes) {
          const field = change.field;
          const value = change.value;

          if (field === "comments") {
            // Handle new comment
            await this.handleNewComment(value);
          } else if (field === "messages") {
            // Handle new message
            await this.handleNewMessage(value);
          } else if (field === "story_insights") {
            // Handle story insights
            await this.handleStoryInsights(value);
          }
        }
      }
    }
  }

  /**
   * Handle new comment webhook event
   */
  private async handleNewComment(value: any) {
    // Store comment in database
    console.log("New Instagram comment:", value);
    // TODO: Store in instagram_comments table
  }

  /**
   * Handle new message webhook event
   */
  private async handleNewMessage(value: any) {
    // Handle DM
    console.log("New Instagram message:", value);
    // TODO: Store in message inbox
  }

  /**
   * Handle story insights webhook event
   */
  private async handleStoryInsights(value: any) {
    console.log("Story insights update:", value);
    // TODO: Update story metrics
  }
}

export default InstagramService;
