import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondSuccess, respondError } from "../../shared/response.js";

export const videoConsultationRoutes = Router();

/**
 * C2 Priority: Create video session with Google Meet
 */
videoConsultationRoutes.post("/sessions", async (req, res, next) => {
  try {
    const { booking_id, client_id, staff_id, scheduled_at, duration_minutes = 30 } = req.body;
    const organizationId = getRequiredOrganizationId(res);

    if (!booking_id || !client_id || !staff_id || !scheduled_at) {
      return respondError(res, "MISSING_REQUIRED_FIELDS", "Missing required fields", 400);
    }

    // Generate Google Meet link
    const meetLink = await generateGoogleMeetLink(scheduled_at, duration_minutes);

    // Create session
    const result = await queryDb<{ id: string; meet_link: string }>(
      `INSERT INTO video_sessions (org_id, booking_id, client_id, staff_id, scheduled_at, duration_minutes, meet_link, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', NOW())
       RETURNING id, meet_link`,
      [organizationId, booking_id, client_id, staff_id, scheduled_at, duration_minutes, meetLink]
    );

    // Notify client (queue notification)
    await queryDb(
      `INSERT INTO notifications (org_id, user_id, type, title, message, metadata, created_at)
       VALUES ($1, $2, 'video_session', 'Video Consultation Scheduled', $3, $4, NOW())`,
      [
        organizationId,
        client_id,
        `Your video consultation is scheduled. Join link: ${meetLink}`,
        JSON.stringify({ session_id: result[0].id, meet_link: meetLink })
      ]
    );

    return res.status(201).json(result[0]);
  } catch (err) {
    return next(err);
  }
});

/**
 * Get video sessions
 */
videoConsultationRoutes.get("/sessions", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { status } = req.query;

    let query = `SELECT id, booking_id, client_id, staff_id, scheduled_at, duration_minutes, meet_link, status, started_at, ended_at
                 FROM video_sessions WHERE org_id = $1`;
    const params: any[] = [organizationId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY scheduled_at DESC LIMIT 50`;

    const sessions = await queryDb(query, params);
    return res.json({ count: sessions.length, sessions });
  } catch (err) {
    return next(err);
  }
});

/**
 * Join session (mark as started)
 */
videoConsultationRoutes.post("/sessions/:id/join", async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = getRequiredOrganizationId(res);

    await queryDb(
      `UPDATE video_sessions SET status = 'in_progress', started_at = NOW() WHERE id = $1 AND org_id = $2`,
      [id, organizationId]
    );

    return res.json({ joined: true, session_id: id });
  } catch (err) {
    return next(err);
  }
});

/**
 * End session and record notes
 */
videoConsultationRoutes.post("/sessions/:id/end", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const organizationId = getRequiredOrganizationId(res);

    await queryDb(
      `UPDATE video_sessions SET status = 'completed', ended_at = NOW(), notes = $3 WHERE id = $1 AND org_id = $2`,
      [id, organizationId, notes || ""]
    );

    return res.json({ ended: true, session_id: id });
  } catch (err) {
    return next(err);
  }
});

/**
 * Generate Google Meet link
 */
async function generateGoogleMeetLink(scheduledAt: string, durationMinutes: number): Promise<string> {
  try {
    // If Google Calendar API is configured
    if (process.env.GOOGLE_CALENDAR_CREDENTIALS) {
      const { google } = await import("googleapis");
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CALENDAR_CREDENTIALS),
        scopes: ["https://www.googleapis.com/auth/calendar"]
      });

      const calendar = google.calendar({ version: "v3", auth });

      const event = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: 1,
        requestBody: {
          summary: "KÓRA Video Consultation",
          start: { dateTime: scheduledAt },
          end: { dateTime: new Date(new Date(scheduledAt).getTime() + durationMinutes * 60000).toISOString() },
          conferenceData: {
            createRequest: { requestId: `kora-${Date.now()}` }
          }
        }
      });

      return event.data.hangoutLink || `https://meet.google.com/kora-${Date.now().toString(36)}`;
    }
  } catch (err) {
    console.error("Failed to create Google Meet link:", err);
  }

  // Fallback: generate pseudo-link
  return `https://meet.google.com/kora-${Date.now().toString(36)}`;
}

