import { randomUUID } from "node:crypto";
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
  const jobId = randomUUID();
  const job = await notificationsQueue.add("dispatch_notification", data, {
    jobId,
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 200,
    removeOnFail: 500
  });
  if (job.id === undefined || job.id === null) {
    Object.defineProperty(job, "id", { value: jobId, configurable: true });
  }
  return job;
}

export async function enqueueCampaignDispatch(data: CampaignJobData) {
  const jobId = randomUUID();
  const job = await notificationsQueue.add("campaign_send", data, {
    jobId,
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 500
  });
  if (job.id === undefined || job.id === null) {
    Object.defineProperty(job, "id", { value: jobId, configurable: true });
  }
  return job;
}

export async function enqueueReportGeneration(data: ReportJobData) {
  const jobId = randomUUID();
  const job = await reportingQueue.add("generate_report", data, {
    jobId,
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 500
  });
  if (job.id === undefined || job.id === null) {
    Object.defineProperty(job, "id", { value: jobId, configurable: true });
  }
  return job;
}

export async function enqueueAnomalyDetection(data: AnomalyDetectionJobData) {
  const jobId = randomUUID();
  const job = await anomalyQueue.add("detect_anomaly", data, {
    jobId,
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 200,
    removeOnFail: 500
  });
  if (job.id === undefined || job.id === null) {
    Object.defineProperty(job, "id", { value: jobId, configurable: true });
  }
  return job;
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
