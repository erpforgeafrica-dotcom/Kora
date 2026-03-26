import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondError } from "../../shared/response.js";

export const socialOAuthRoutes = Router();

/**
 * C1 Priority: Universal OAuth Connect
 * Supports: Instagram, Facebook, WhatsApp, Twitter, TikTok
 */
socialOAuthRoutes.post("/connect", async (req, res, next) => {
  try {
    const { platform, auth_url } = req.body;
    const organizationId = getRequiredOrganizationId(res);

    const validPlatforms = ["instagram", "facebook", "whatsapp", "twitter", "tiktok"];
    if (!validPlatforms.includes(platform)) {
      return respondError(res, "INVALID_PLATFORM", "Invalid platform", 400);
    }

    // Generate state token for CSRF protection
    const state = Buffer.from(JSON.stringify({ org_id: organizationId, platform, timestamp: Date.now() })).toString("base64");

    // Platform-specific OAuth URLs
    const oauthUrls: Record<string, string> = {
      instagram: `https://api.instagram.com/oauth/authorize?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.META_OAUTH_REDIRECT_URI}&scope=user_profile,user_media&response_type=code&state=${state}`,
      facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.META_OAUTH_REDIRECT_URI}&scope=pages_show_list,pages_read_engagement,pages_manage_posts&response_type=code&state=${state}`,
      whatsapp: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.META_OAUTH_REDIRECT_URI}&scope=whatsapp_business_management,whatsapp_business_messaging&response_type=code&state=${state}`,
      twitter: `https://twitter.com/i/oauth2/authorize?client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${process.env.TWITTER_REDIRECT_URI}&scope=tweet.read%20tweet.write%20users.read&response_type=code&state=${state}&code_challenge=challenge&code_challenge_method=plain`,
      tiktok: `https://www.tiktok.com/auth/authorize?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${process.env.TIKTOK_REDIRECT_URI}&scope=user.info.basic,video.list&response_type=code&state=${state}`
    };

    return res.json({ auth_url: oauthUrls[platform], state });
  } catch (err) {
    return next(err);
  }
});

/**
 * C1 Priority: Universal OAuth Callback
 */
socialOAuthRoutes.post("/callback", async (req, res, next) => {
  try {
    const { code, state, platform } = req.body;

    if (!code || !state) {
      return respondError(res, "MISSING_CODE_OR_STATE", "Missing code or state", 400);
    }

    // Decode state
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const { org_id, platform: statePlatform } = stateData;

    if (platform !== statePlatform) {
      return respondError(res, "PLATFORM_MISMATCH", "Platform mismatch", 400);
    }

    // Exchange code for token (platform-specific)
    let accessToken = "";
    let accountId = "";
    let accountName = "";

    if (["instagram", "facebook", "whatsapp"].includes(platform)) {
      // Meta platforms
      const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${process.env.META_OAUTH_REDIRECT_URI}&code=${code}`);
      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
      const userData = await userResponse.json();
      accountId = userData.id;
      accountName = userData.name || platform;
    } else if (platform === "twitter") {
      // Twitter OAuth 2.0
      const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: process.env.TWITTER_CLIENT_ID || "",
          redirect_uri: process.env.TWITTER_REDIRECT_URI || "",
          code_verifier: "challenge"
        })
      });
      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      accountId = tokenData.user_id || "twitter_user";
      accountName = "Twitter Account";
    } else if (platform === "tiktok") {
      // TikTok OAuth
      const tokenResponse = await fetch("https://open-api.tiktok.com/oauth/access_token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY || "",
          client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
          code,
          grant_type: "authorization_code"
        })
      });
      const tokenData = await tokenResponse.json();
      accessToken = tokenData.data?.access_token;
      accountId = tokenData.data?.open_id || "tiktok_user";
      accountName = "TikTok Account";
    }

    // Store connection
    await queryDb(
      `INSERT INTO social_connections (org_id, platform, account_id, account_name, access_token, is_active, connected_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       ON CONFLICT (org_id, platform, account_id) DO UPDATE SET access_token = $5, is_active = true, connected_at = NOW()`,
      [org_id, platform, accountId, accountName, accessToken]
    );

    return res.json({ success: true, platform, account_id: accountId, account_name: accountName });
  } catch (err) {
    return next(err);
  }
});

