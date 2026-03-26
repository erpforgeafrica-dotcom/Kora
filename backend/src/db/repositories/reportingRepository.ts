// Reporting Repository - Report definitions, executions, scheduling
import { queryDb } from "../client.js";

export const ReportingRepository = {
  // === REPORT DEFINITIONS ===

  async getReportDefinition(reportId: string, organizationId: string) {
    const result = await queryDb(
      `SELECT * FROM report_definitions 
       WHERE id = $1 AND organization_id = $2`,
      [reportId, organizationId]
    );
    return result[0] || null;
  },

  async listReportDefinitions(organizationId: string, filters: { type?: string; limit?: number } = {}) {
    const limit = filters.limit || 50;
    const typeFilter = filters.type ? " AND type = $2" : "";
    const params = filters.type ? [organizationId, filters.type, limit] : [organizationId, limit];

    const result = await queryDb(
      `SELECT * FROM report_definitions 
       WHERE organization_id = $1${typeFilter}
       ORDER BY created_at DESC
       LIMIT $${filters.type ? 3 : 2}`,
      params
    );
    return result;
  },

  async createReportDefinition(data: {
    organization_id: string;
    name: string;
    type: string; // financial, clinical, operational, activity
    description?: string;
    query_config: Record<string, unknown>;
    schedule?: string; // cron expression
    enabled: boolean;
  }) {
    const result = await queryDb(
      `INSERT INTO report_definitions 
       (organization_id, name, type, description, query_config, schedule, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.organization_id, data.name, data.type, data.description || null, JSON.stringify(data.query_config), data.schedule || null, data.enabled]
    );
    return result[0];
  },

  async updateReportDefinition(reportId: string, organizationId: string, updates: Partial<{
    name: string;
    description: string;
    query_config: Record<string, unknown>;
    schedule: string;
    enabled: boolean;
  }>) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    if (updates.name) {
      setClauses.push(`name = $${paramIndex}`);
      params.push(updates.name);
      paramIndex++;
    }
    if (updates.description) {
      setClauses.push(`description = $${paramIndex}`);
      params.push(updates.description);
      paramIndex++;
    }
    if (updates.query_config) {
      setClauses.push(`query_config = $${paramIndex}`);
      params.push(JSON.stringify(updates.query_config));
      paramIndex++;
    }
    if (updates.schedule !== undefined) {
      setClauses.push(`schedule = $${paramIndex}`);
      params.push(updates.schedule);
      paramIndex++;
    }
    if (updates.enabled !== undefined) {
      setClauses.push(`enabled = $${paramIndex}`);
      params.push(updates.enabled);
      paramIndex++;
    }

    if (setClauses.length === 0) return null;

    params.push(reportId, organizationId);
    const result = await queryDb(
      `UPDATE report_definitions 
       SET ${setClauses.join(", ")}, updated_at = NOW()
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );
    return result[0] || null;
  },

  // === REPORT EXECUTIONS ===

  async getReportExecution(executionId: string, organizationId: string) {
    const result = await queryDb(
      `SELECT * FROM report_executions 
       WHERE id = $1 AND organization_id = $2`,
      [executionId, organizationId]
    );
    return result[0] || null;
  },

  async listReportExecutions(reportId: string, organizationId: string, limit: number = 50) {
    const result = await queryDb(
      `SELECT * FROM report_executions 
       WHERE report_id = $1 AND organization_id = $2
       ORDER BY executed_at DESC
       LIMIT $3`,
      [reportId, organizationId, limit]
    );
    return result;
  },

  async createReportExecution(data: {
    organization_id: string;
    report_id: string;
    status: string; // pending, running, completed, failed
    executed_at: string;
    result_data?: Record<string, unknown>;
    error_message?: string;
  }) {
    const result = await queryDb(
      `INSERT INTO report_executions 
       (organization_id, report_id, status, executed_at, result_data, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.organization_id, data.report_id, data.status, data.executed_at, data.result_data ? JSON.stringify(data.result_data) : null, data.error_message || null]
    );
    return result[0];
  },

  async updateReportExecution(executionId: string, organizationId: string, updates: {
    status: string;
    result_data?: Record<string, unknown>;
    error_message?: string;
  }) {
    const result = await queryDb(
      `UPDATE report_executions 
       SET status = $1, result_data = $2, error_message = $3, updated_at = NOW()
       WHERE id = $4 AND organization_id = $5
       RETURNING *`,
      [updates.status, updates.result_data ? JSON.stringify(updates.result_data) : null, updates.error_message || null, executionId, organizationId]
    );
    return result[0] || null;
  },

  // === REPORT SCHEDULES ===

  async listScheduledReports(organizationId: string) {
    const result = await queryDb(
      `SELECT * FROM report_definitions 
       WHERE organization_id = $1 AND schedule IS NOT NULL AND enabled = true
       ORDER BY name`,
      [organizationId]
    );
    return result;
  },

  async getReportTimings(reportId: string, organizationId: string) {
    const result = await queryDb(
      `SELECT 
        rd.id, rd.name, rd.schedule,
        re.executed_at, re.status,
        EXTRACT(EPOCH FROM (re.updated_at - re.created_at))::integer as execution_time_seconds
       FROM report_definitions rd
       LEFT JOIN LATERAL (
         SELECT * FROM report_executions WHERE report_id = rd.id ORDER BY created_at DESC LIMIT 1
       ) re ON true
       WHERE rd.id = $1 AND rd.organization_id = $2`,
      [reportId, organizationId]
    );
    return result[0] || null;
  },

  // === ANALYTICS ===

  async getReportStats(organizationId: string) {
    const result = await queryDb(
      `SELECT 
        rd.type,
        COUNT(rd.id) as definition_count,
        COUNT(CASE WHEN rd.enabled = true THEN 1 END) as enabled_count,
        COUNT(re.id) as total_executions,
        COUNT(CASE WHEN re.status = 'completed' THEN 1 END) as successful,
        COUNT(CASE WHEN re.status = 'failed' THEN 1 END) as failed
       FROM report_definitions rd
       LEFT JOIN report_executions re ON rd.id = re.report_id
       WHERE rd.organization_id = $1
       GROUP BY rd.type`,
      [organizationId]
    );
    return result;
  },

  async getExecutionTrend(reportId: string, organizationId: string, days: number = 30) {
    const result = await queryDb(
      `SELECT 
        DATE(executed_at) as date,
        COUNT(*) as execution_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))::integer as avg_time_seconds
       FROM report_executions 
       WHERE report_id = $1 AND organization_id = $2 AND executed_at > NOW() - INTERVAL '${days} days'
       GROUP BY date
       ORDER BY date DESC`,
      [reportId, organizationId]
    );
    return result;
  }
};
