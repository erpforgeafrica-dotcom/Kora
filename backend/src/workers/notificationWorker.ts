import { Worker, Job } from "bullmq";
import { queueConnection, type NotificationJobData } from "../../queues/index.js";
import { queryDb } from "../../db/client.js";
import { logger } from "../../shared/logger.js";

/**
 * Notification Delivery Worker
 *
 * Processes jobs from the "notifications" queue.
 * Channels: email (via SendGrid), sms (via Twilio), whatsapp, push
 *
 * To enable real delivery, set these env vars:
 *   SENDGRID_API_KEY   — email
 *   TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER — SMS/WhatsApp
 */

async function deliverEmail(payload: Record<string, unknown>, orgId: string): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    logger.warn("SENDGRID_API_KEY not set — email delivery skipped", { orgId });
    return false;
  }
  const to = payload.to as string;
  const subject = (payload.subject as string) ?? "Notification from KORA";
  const body = (payload.body as string) ?? (payload.template as string) ?? "";
  if (!to) return false;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL ?? "noreply@kora.app" },
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
  });
  return res.ok;
}

async function deliverSms(payload: Record<string, unknown>, orgId: string): Promise<boolean> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    logger.warn("Twilio env vars not set — SMS delivery skipped", { orgId });
    return false;
  }
  const to   = payload.to as string;
  const body = (payload.body as string) ?? (payload.message as string) ?? "";
  if (!to || !body) return false;

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  });
  return res.ok;
}

async function deliverWhatsApp(payload: Record<string, unknown>, orgId: string): Promise<boolean> {
  // WhatsApp via Twilio — same credentials, different From prefix
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_NUMBER ?? process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    logger.warn("WhatsApp env vars not set — delivery skipped", { orgId });
    return false;
  }
  const to   = payload.to as string;
  const body = (payload.body as string) ?? (payload.message as string) ?? "";
  if (!to || !body) return false;

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: `whatsapp:${to}`, From: `whatsapp:${from}`, Body: body }).toString(),
  });
  return res.ok;
}

async function processNotification(job: Job<NotificationJobData>) {
  const { organizationId, channel, payload } = job.data;
  logger.info("Processing notification", { jobId: job.id, channel, orgId: organizationId });

  let delivered = false;
  let error: string | null = null;

  try {
    switch (channel) {
      case "email":     delivered = await deliverEmail(payload, organizationId); break;
      case "sms":       delivered = await deliverSms(payload, organizationId); break;
      case "whatsapp":  delivered = await deliverWhatsApp(payload, organizationId); break;
      case "push":
        logger.info("Push notifications not yet configured", { orgId: organizationId });
        delivered = false;
        break;
      default:
        logger.warn("Unknown notification channel", { channel });
    }
  } catch (err: any) {
    error = err?.message ?? "Unknown delivery error";
    logger.error("Notification delivery error", { jobId: job.id, channel, error });
  }

  // Update notification record in DB
  await queryDb(
    `UPDATE notifications SET status=$1, updated_at=now()
     WHERE organization_id=$2 AND payload->>'job_id'=$3`,
    [delivered ? "sent" : "failed", organizationId, job.id ?? ""]
  ).catch(() => {});

  if (!delivered && !error) {
    // Provider not configured — mark as skipped, don't retry
    logger.info("Notification skipped — provider not configured", { channel, orgId: organizationId });
    return { skipped: true, channel };
  }

  if (error) throw new Error(error); // triggers BullMQ retry

  return { delivered, channel };
}

export function createNotificationWorker() {
  const worker = new Worker<NotificationJobData>(
    "notifications",
    processNotification,
    {
      connection: queueConnection,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    logger.info("Notification delivered", { jobId: job.id, channel: job.data.channel });
  });

  worker.on("failed", (job, err) => {
    logger.error("Notification failed", { jobId: job?.id, channel: job?.data?.channel, err: err.message });
  });

  return worker;
}
