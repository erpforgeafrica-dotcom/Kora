import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondSuccess, respondError } from "../../shared/response.js";
import { MetaOAuthService, InstagramService, FacebookService } from "../../services/meta/index.js";

export const socialRoutes = Router();

function getMetaOAuth() {
  return new MetaOAuthService(
    process.env.META_APP_ID || "",
    process.env.META_APP_SECRET || "",
    process.env.META_OAUTH_REDIRECT_URI || `${process.env.API_BASE_URL || "http://localhost:3000"}/api/social/meta/callback`
  );
}

/**
 * Get OAuth authorization URL for Meta
 */
socialRoutes.post("/meta/authorize", async (req, res) => {
  try {
    const state = MetaOAuthService.generateState();
    const authUrl = getMetaOAuth().getAuthorizationUrl(state);

    // Store state in session or redis for verification
    // For now, we'll return it for client to store
    return res.json({ auth_url: authUrl, state });
  } catch (err) {
    return respondError(res, "FAILED_TO_GENERATE_AUTHORIZATION_URL", "Failed to generate authorization URL", 400);
  }
});

/**
 * Meta OAuth callback handler
 */
socialRoutes.post("/meta/callback", async (req, res, next) => {
  try {
    const { code, state } = req.body;
    const organizationId = getRequiredOrganizationId(res);

    if (!code) {
      return respondError(res, "AUTHORIZATION_CODE_NOT_PROVIDED", "Authorization code not provided", 400);
    }

    // Exchange code for access token
    const metaOAuth = getMetaOAuth();
    const tokenData = await metaOAuth.exchangeCodeForToken(code);

    // Get user info
    const userInfo = await metaOAuth.getUserInfo(tokenData.access_token);

    // Get page accounts (Facebook pages and Instagram accounts)
    const pageAccounts = await metaOAuth.getPageAccounts(tokenData.access_token);

    // Store primary connection
    await metaOAuth.storeConnection(
      organizationId,
      res.locals.auth?.userId,
      "facebook",
      userInfo.id,
      userInfo.name,
      tokenData.access_token
    );

    return respondSuccess(res, {
      user: userInfo,
      pages: pageAccounts,
      token_stored: true
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * Connect specific Instagram business account
 */
socialRoutes.post("/meta/instagram/connect", async (req, res, next) => {
  try {
    const { account_id, account_name, access_token } = req.body;
    const organizationId = getRequiredOrganizationId(res);

    if (!account_id || !access_token) {
      return respondError(res, "MISSING_REQUIRED_FIELDS", "Missing required fields", 400);
    }

    // Store Instagram connection
    const connection = await getMetaOAuth().storeConnection(
      organizationId,
      res.locals.auth?.userId,
      "instagram",
      account_id,
      account_name || account_id,
      access_token
    );

    // Get Instagram account info to verify
    const instagramService = new InstagramService(access_token);
    const accountInfo = await instagramService.getBusinessAccount(account_id);

    return respondSuccess(res, {
      connection,
      account: accountInfo,
      status: "connected"
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * Connect specific Facebook page
 */
socialRoutes.post("/meta/facebook/connect", async (req, res, next) => {
  try {
    const { page_id, page_name, access_token } = req.body;
    const organizationId = getRequiredOrganizationId(res);

    if (!page_id || !access_token) {
      return respondError(res, "MISSING_REQUIRED_FIELDS", "Missing required fields", 400);
    }

    // Store Facebook connection
    const connection = await getMetaOAuth().storeConnection(
      organizationId,
      res.locals.auth?.userId,
      "facebook",
      page_id,
      page_name || page_id,
      access_token
    );

    // Get Facebook page info to verify
    const facebookService = new FacebookService(access_token);
    const pageInfo = await facebookService.getPageInfo(page_id);

    return respondSuccess(res, {
      connection,
      page: pageInfo,
      status: "connected"
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * Get Instagram media for account
 */
socialRoutes.get("/meta/instagram/:accountId/media", async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const organizationId = getRequiredOrganizationId(res);

    const connection = await getMetaOAuth().getConnection(organizationId, "instagram", accountId);
    if (!connection) {
      return respondError(res, "INSTAGRAM_ACCOUNT_NOT_CONNECTED", "Instagram account not connected", 404);
    }

    const instagramService = new InstagramService(connection.access_token);
    const media = await instagramService.getMedia(accountId);

    return respondSuccess(res, { account_id: accountId, media });
  } catch (err) {
    return next(err);
  }
});

/**
 * Get Facebook page posts
 */
socialRoutes.get("/meta/facebook/:pageId/posts", async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const organizationId = getRequiredOrganizationId(res);

    const connection = await getMetaOAuth().getConnection(organizationId, "facebook", pageId);
    if (!connection) {
      return respondError(res, "FACEBOOK_PAGE_NOT_CONNECTED", "Facebook page not connected", 404);
    }

    const facebookService = new FacebookService(connection.access_token);
    const posts = await facebookService.getPagePosts(pageId);

    return respondSuccess(res, { page_id: pageId, posts });
  } catch (err) {
    return next(err);
  }
});

/**
 * Schedule Instagram post
 */
socialRoutes.post("/meta/instagram/:accountId/schedule", async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { media_urls, caption, scheduled_time } = req.body;
    const organizationId = getRequiredOrganizationId(res);

    if (!media_urls || !Array.isArray(media_urls) || !caption || !scheduled_time) {
      return respondError(res, "MISSING_REQUIRED_FIELDS", "Missing required fields", 400);
    }

    const connection = await getMetaOAuth().getConnection(organizationId, "instagram", accountId);
    if (!connection) {
      return respondError(res, "INSTAGRAM_ACCOUNT_NOT_CONNECTED", "Instagram account not connected", 404);
    }

    const instagramService = new InstagramService(connection.access_token);
    const post = await instagramService.schedulePost(
      accountId,
      media_urls,
      caption,
      new Date(scheduled_time)
    );

    // Store in database
    await instagramService.storeScheduledMedia(
      organizationId,
      accountId,
      post.id,
      media_urls,
      caption,
      new Date(scheduled_time)
    );

    return res.status(201).json(post);
  } catch (err) {
    return next(err);
  }
});

/**
 * Schedule Facebook post
 */
socialRoutes.post("/meta/facebook/:pageId/schedule", async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const { message, media_urls = [], scheduled_time } = req.body;
    const organizationId = getRequiredOrganizationId(res);

    if (!message || !scheduled_time) {
      return respondError(res, "MISSING_REQUIRED_FIELDS", "Missing required fields", 400);
    }

    const connection = await getMetaOAuth().getConnection(organizationId, "facebook", pageId);
    if (!connection) {
      return respondError(res, "FACEBOOK_PAGE_NOT_CONNECTED", "Facebook page not connected", 404);
    }

    const facebookService = new FacebookService(connection.access_token);
    const post = await facebookService.createPost(
      pageId,
      message,
      media_urls,
      new Date(scheduled_time)
    );

    // Store in database
    await facebookService.storeScheduledPost(
      organizationId,
      pageId,
      post.id,
      message,
      media_urls,
      new Date(scheduled_time)
    );

    return res.status(201).json(post);
  } catch (err) {
    return next(err);
  }
});

/**
 * List all Meta connections
 */
socialRoutes.get("/meta/connections", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const connections = await getMetaOAuth().listConnections(organizationId);

    return respondSuccess(res, connections);
  } catch (err) {
    return next(err);
  }
});

/**
 * Disconnect Meta account
 */
socialRoutes.post("/meta/disconnect/:platform/:accountId", async (req, res, next) => {
  try {
    const { platform, accountId } = req.params;
    const organizationId = getRequiredOrganizationId(res);

    if (!["instagram", "facebook"].includes(platform)) {
      return respondError(res, "INVALID_PLATFORM", "Invalid platform", 400);
    }

    await getMetaOAuth().disconnectAccount(organizationId, platform, accountId);

    return respondSuccess(res, { disconnected: true, platform, account_id: accountId });
  } catch (err) {
    return next(err);
  }
});

/**
 * Universal: Create/schedule social posts
 */
socialRoutes.post("/posts", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { content, platforms, media_urls = [], scheduled_at, social_accounts } = req.body;

    if (!content || !platforms || !Array.isArray(platforms)) {
      return respondError(res, "MISSING_CONTENT_OR_PLATFORMS", "Missing content or platforms", 400);
    }

    // Store in database
    const result = await queryDb<{ id: string }>(
      `INSERT INTO social_posts (org_id, content, platforms, media_urls, status, scheduled_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        organizationId,
        content,
        JSON.stringify(platforms),
        JSON.stringify(media_urls),
        scheduled_at ? "scheduled" : "draft",
        scheduled_at || null,
        res.locals.auth?.userId
      ]
    );

    // If scheduling, post to appropriate platforms
    if (scheduled_at && social_accounts) {
      const scheduledTime = new Date(scheduled_at);

      for (const account of social_accounts) {
        const { platform, account_id, access_token } = account;

        try {
          if (platform === "instagram") {
            const instagramService = new InstagramService(access_token);
            await instagramService.schedulePost(account_id, media_urls, content, scheduledTime);
          } else if (platform === "facebook") {
            const facebookService = new FacebookService(access_token);
            await facebookService.createPost(account_id, content, media_urls, scheduledTime);
          }
        } catch (err) {
          console.error(`Failed to schedule post to ${platform}:`, err);
        }
      }
    }

    return res.status(201).json({
      post_id: result[0].id,
      status: scheduled_at ? "scheduled" : "draft"
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * Get all social posts
 */
socialRoutes.get("/posts", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const posts = await queryDb(
      `SELECT id, content, platforms, status, scheduled_at, published_at, created_at
       FROM social_posts WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [organizationId]
    );

    return respondSuccess(res, posts);
  } catch (err) {
    return next(err);
  }
});

/**
 * Publish a scheduled post
 */
socialRoutes.post("/posts/:id/publish", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    await queryDb(
      `UPDATE social_posts SET status = 'published', published_at = NOW() WHERE id = $1 AND org_id = $2`,
      [req.params.id, organizationId]
    );

    return respondSuccess(res, { published: true });
  } catch (err) {
    return next(err);
  }
});

/**
 * Get all social connections
 */
socialRoutes.get("/connections", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const connections = await queryDb(
      `SELECT platform, account_name, is_active, connected_at 
       FROM social_connections 
       WHERE org_id = $1 
       ORDER BY connected_at DESC`,
      [organizationId]
    );

    return respondSuccess(res, connections);
  } catch (err) {
    return next(err);
  }
});

