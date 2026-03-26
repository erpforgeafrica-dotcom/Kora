import crypto from "crypto";
import { queryDb } from "../../db/client.js";

interface MetaOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface FacebookUser {
  id: string;
  name: string;
  email: string;
  picture?: {
    data: {
      height: number;
      is_silhouette: boolean;
      url: string;
      width: number;
    };
  };
}

interface FacebookPageAccount {
  access_token: string;
  category: string;
  category_list: Array<{ id: string; name: string }>;
  name: string;
  id: string;
}

class MetaOAuthService {
  private config: MetaOAuthConfig;
  private baseUrl = "https://graph.facebook.com/v18.0";

  constructor(appId: string, appSecret: string, redirectUri: string) {
    if (!appId || !appSecret || !redirectUri) {
      throw new Error("Missing Meta OAuth configuration");
    }
    this.config = { appId, appSecret, redirectUri };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string, scopes: string[] = [
    "email",
    "public_profile",
    "pages_show_list",
    "instagram_basic",
    "instagram_manage_messages",
    "pages_manage_metadata",
    "pages_read_engagement",
    "pages_read_user_content",
    "pages_manage_posts",
    "pages_manage_engagement"
  ]): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: scopes.join(","),
      response_type: "code",
      auth_type: "rerequest"
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      redirect_uri: this.config.redirectUri,
      code
    });

    const response = await fetch(`${this.baseUrl}/oauth/access_token?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta OAuth error: ${error.error?.message || "Unknown error"}`);
    }

    const data: TokenResponse = await response.json();
    return data;
  }

  /**
   * Get user info from access token
   */
  async getUserInfo(accessToken: string): Promise<FacebookUser> {
    const params = new URLSearchParams({
      fields: "id,name,email,picture.width(200).height(200)",
      access_token: accessToken
    });

    const response = await fetch(`${this.baseUrl}/me?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user info from Meta");
    }

    return response.json();
  }

  /**
   * Get Facebook pages accessible by user
   */
  async getPageAccounts(userAccessToken: string): Promise<FacebookPageAccount[]> {
    const params = new URLSearchParams({
      fields: "access_token,category,category_list,name,id,picture.width(200).height(200)",
      access_token: userAccessToken,
      limit: "100"
    });

    const response = await fetch(`${this.baseUrl}/me/accounts?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch page accounts from Meta");
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Refresh long-lived access token (valid for ~60 days)
   */
  async refreshAccessToken(accessToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      fb_exchange_token: accessToken
    });

    const response = await fetch(`${this.baseUrl}/oauth/access_token?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Meta access token");
    }

    return response.json();
  }

  /**
   * Store Meta connection in database
   */
  async storeConnection(
    organizationId: string,
    userId: string,
    platform: "instagram" | "facebook",
    accountId: string,
    accountName: string,
    accessToken: string,
    refreshToken?: string
  ) {
    const encryptedToken = this.encryptToken(accessToken);

    await queryDb(
      `INSERT INTO social_connections 
       (org_id, user_id, platform, account_id, account_name, access_token, refresh_token, is_active, connected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
       ON CONFLICT (org_id, platform, account_id) 
       DO UPDATE SET 
         access_token = $6, 
         refresh_token = $7,
         is_active = true,
         connected_at = NOW()`,
      [organizationId, userId, platform, accountId, accountName, encryptedToken, refreshToken ? this.encryptToken(refreshToken) : null]
    );

    return { platform, accountId, accountName };
  }

  /**
   * Get stored connection
   */
  async getConnection(organizationId: string, platform: "instagram" | "facebook", accountId: string) {
    const result = await queryDb(
      `SELECT platform, account_id, account_name, access_token, refresh_token, is_active, connected_at, last_refreshed_at
       FROM social_connections
       WHERE org_id = $1 AND platform = $2 AND account_id = $3`,
      [organizationId, platform, accountId]
    );

    if (result.length === 0) {
      return null;
    }

    const record = result[0];
    return {
      ...record,
      access_token: this.decryptToken(record.access_token),
      refresh_token: record.refresh_token ? this.decryptToken(record.refresh_token) : null
    };
  }

  /**
   * List all connections for organization
   */
  async listConnections(organizationId: string) {
    const connections = await queryDb(
      `SELECT platform, account_id, account_name, is_active, connected_at, last_refreshed_at
       FROM social_connections
       WHERE org_id = $1 AND platform IN ('instagram', 'facebook')
       ORDER BY connected_at DESC`,
      [organizationId]
    );

    return connections;
  }

  /**
   * Disconnect a social account
   */
  async disconnectAccount(organizationId: string, platform: string, accountId: string) {
    await queryDb(
      `UPDATE social_connections 
       SET is_active = false, disconnected_at = NOW()
       WHERE org_id = $1 AND platform = $2 AND account_id = $3`,
      [organizationId, platform, accountId]
    );
  }

  /**
   * Generate secure state for OAuth
   */
  static generateState(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * Encrypt sensitive token (basic encryption - use vault in production)
   */
  private encryptToken(token: string): string {
    const key = process.env.ENCRYPTION_KEY || "default-key-change-me";
    const cipher = crypto.createCipher("aes192", key);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  /**
   * Decrypt token
   */
  private decryptToken(encrypted: string): string {
    const key = process.env.ENCRYPTION_KEY || "default-key-change-me";
    const decipher = crypto.createDecipher("aes192", key);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}

export default MetaOAuthService;
