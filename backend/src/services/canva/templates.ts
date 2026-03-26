import { queryDb } from "../../db/client.js";

export async function listCanvaTemplates(organizationId: string) {
  return queryDb<{
    id: string;
    external_template_id: string;
    name: string;
    category: string | null;
    preview_url: string | null;
    brand_kit_json: Record<string, unknown>;
    created_at: string;
  }>(
    `SELECT id::text, external_template_id, name, category, preview_url, brand_kit_json, created_at::text
     FROM canva_templates
     WHERE organization_id = $1
     ORDER BY created_at DESC`,
    [organizationId]
  );
}

export async function saveCanvaTemplate(
  organizationId: string,
  payload: {
    external_template_id: string;
    name: string;
    category?: string | null;
    preview_url?: string | null;
    brand_kit_json?: Record<string, unknown>;
  }
) {
  const [template] = await queryDb<{
    id: string;
    external_template_id: string;
    name: string;
    category: string | null;
    preview_url: string | null;
    brand_kit_json: Record<string, unknown>;
    created_at: string;
  }>(
    `INSERT INTO canva_templates (organization_id, external_template_id, name, category, preview_url, brand_kit_json)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING id::text, external_template_id, name, category, preview_url, brand_kit_json, created_at::text`,
    [
      organizationId,
      payload.external_template_id,
      payload.name,
      payload.category ?? null,
      payload.preview_url ?? null,
      JSON.stringify(payload.brand_kit_json ?? {})
    ]
  );

  return template;
}
