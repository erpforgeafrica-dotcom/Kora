export async function exportCanvaDesign(payload: {
  template_id: string;
  format?: "png" | "jpg" | "pdf";
  title?: string | null;
}) {
  return {
    template_id: payload.template_id,
    format: payload.format ?? "png",
    export_url: `https://cdn.kora.local/canva/${payload.template_id}.${payload.format ?? "png"}`,
    title: payload.title ?? "Untitled design"
  };
}
