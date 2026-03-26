import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const redisUri = new URL(redisUrl);

export const queueConnection = {
  host: redisUri.hostname,
  port: Number(redisUri.port || "6379")
};

export const notificationsQueue = new Queue("notifications", {
  connection: queueConnection
});

export const reportingQueue = new Queue("reporting", {
  connection: queueConnection
});

export const anomalyQueue = new Queue("anomaly-detector", {
  connection: queueConnection
});

export interface NotificationJobData {
  organizationId: string;
  channel: "email" | "sms" | "push" | "whatsapp";
  payload: Record<string, unknown>;
}

export interface CampaignJobData {
  organizationId: string;
  campaignId: string;
}

export interface ReportJobData {
  organizationId: string;
  reportType: "daily" | "weekly" | "monthly";
  requestedBy: string;
}

export interface AnomalyDetectionJobData {
  organizationId: string;
  metricName: string;
  currentValue: number;
  timestamp: string;
}

export async function enqueueNotification(data: NotificationJobData) {
  return notificationsQueue.add("dispatch_notification", data, {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 200,
    removeOnFail: 500
  });
}

export async function enqueueCampaignDispatch(data: CampaignJobData) {
  return notificationsQueue.add("campaign_send", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 500
  });
}

export async function enqueueReportGeneration(data: ReportJobData) {
  return reportingQueue.add("generate_report", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 500
  });
}

export async function enqueueAnomalyDetection(data: AnomalyDetectionJobData) {
  return anomalyQueue.add("detect_anomaly", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 200,
    removeOnFail: 500
  });
}

export async function getQueueDepth() {
  const [notificationCounts, reportingCounts, anomalyCounts] = await Promise.all([
    notificationsQueue.getJobCounts(),
    reportingQueue.getJobCounts(),
    anomalyQueue.getJobCounts()
  ]);
  return {
    notifications: notificationCounts.waiting ?? 0,
    reporting: reportingCounts.waiting ?? 0,
    anomaly: anomalyCounts.waiting ?? 0
  };
}
