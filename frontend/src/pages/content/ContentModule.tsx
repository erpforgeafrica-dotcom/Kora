import { useState, useEffect, useCallback } from "react";
import { ActionButton, AudienceSection, StatusPill, EmptyState } from "../../components/audience/AudiencePrimitives";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  listContentArticles, createContentArticle, updateContentArticle,
  updateContentArticleStatus, type ContentArticle,
} from "../../services/api";

// ─── State machine ────────────────────────────────────────────────────────────
const STATUS_TRANSITIONS: Record<ContentArticle["status"], ContentArticle["status"][]> = {
  draft:          ["pending_review"],
  pending_review: ["approved", "draft"],
  approved:       ["published", "draft"],
  published:      ["retracted"],
  retracted:      ["draft"],
};

const STATUS_TONE: Record<ContentArticle["status"], "success"|"warning"|"danger"|"accent"|"muted"> = {
  draft: "muted", pending_review: "warning", approved: "accent", published: "success", retracted: "danger",
};

const AUTHOR_ROLES = ["business_admin", "platform_admin", "staff"];
const MODERATOR_ROLES = ["business_admin", "platform_admin"];

function useArticles(statusFilter: string) {
  const [articles, setArticles] = useState<ContentArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await listContentArticles(statusFilter || undefined);
      setArticles(res.data ?? []);
    } catch (e: any) { setError(e.message ?? "Failed to load articles"); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);
  return { articles, loading, error, reload: load };
}

// ─── Article editor ───────────────────────────────────────────────────────────
function ArticleEditor({ article, onSave, onCancel }: {
  article: Partial<ContentArticle> | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: article?.title ?? "",
    category: article?.category ?? "",
    excerpt: article?.excerpt ?? "",
    body: article?.body ?? "",
    tags: article?.tags ?? [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTag() {
    if (!tagInput.trim()) return;
    setForm(p => ({ ...p, tags: [...p.tags, tagInput.trim()] }));
    setTagInput("");
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true); setError(null);
    try {
      if (article?.id) {
        await updateContentArticle(article.id, form);
      } else {
        await createContentArticle(form);
      }
      onSave();
    } catch (e: any) { setError(e.message ?? "Save failed"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AudienceSection title={article?.id ? "Edit article" : "New article"} meta="Author workspace">
        {error && <div style={{ padding: 10, color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{error}</div>}
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={labelStyle}>Title *</div>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Article title" style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>Category</div>
            <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Healthcare, Operations" style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>Excerpt</div>
            <textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} placeholder="Short summary…" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <div style={labelStyle}>Body</div>
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Full article content…" rows={10} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }} />
          </div>
          <div>
            <div style={labelStyle}>Tags</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {form.tags.map(t => (
                <span key={t} style={{ padding: "3px 8px", borderRadius: 999, background: "var(--color-accent-dim)", color: "var(--color-accent)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                  {t}
                  <button onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, fontSize: 12 }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} placeholder="Add tag…" style={{ ...inputStyle, flex: 1 }} />
              <ActionButton tone="ghost" onClick={addTag}>Add</ActionButton>
            </div>
          </div>
        </div>
      </AudienceSection>
      <div style={{ display: "flex", gap: 8 }}>
        <ActionButton tone="accent" onClick={handleSave} disabled={saving || !form.title.trim()}>
          {saving ? "Saving…" : "Save draft"}
        </ActionButton>
        <ActionButton tone="ghost" onClick={onCancel}>Cancel</ActionButton>
      </div>
    </div>
  );
}

// ─── Article detail ───────────────────────────────────────────────────────────
function ArticleDetail({ article, isModerator, onAction, onEdit }: {
  article: ContentArticle; isModerator: boolean;
  onAction: (id: string, status: ContentArticle["status"]) => void;
  onEdit: () => void;
}) {
  const nextStatuses = STATUS_TRANSITIONS[article.status] ?? [];
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AudienceSection title={article.title} meta={`${article.category ?? "Uncategorized"} · by ${article.author_name ?? "Unknown"}`}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <StatusPill label={article.status.replace(/_/g, " ")} tone={STATUS_TONE[article.status]} />
          {article.tags.map(t => <StatusPill key={t} label={t} tone="muted" />)}
        </div>
        {article.excerpt && <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: 12 }}>{article.excerpt}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Created</div>
            <div style={{ fontSize: 12, color: "var(--color-text-primary)" }}>{new Date(article.created_at).toLocaleDateString()}</div>
          </div>
          {article.published_at && (
            <div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Published</div>
              <div style={{ fontSize: 12, color: "var(--color-text-primary)" }}>{new Date(article.published_at).toLocaleDateString()}</div>
            </div>
          )}
        </div>
      </AudienceSection>

      {nextStatuses.length > 0 && (
        <AudienceSection title="Workflow actions" meta={isModerator ? "Moderation controls" : "Author controls"}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {nextStatuses
              .filter(s => isModerator || ["pending_review", "draft"].includes(s))
              .map(s => (
                <ActionButton key={s} tone={s === "published" ? "accent" : "ghost"} onClick={() => onAction(article.id, s)}>
                  → {s.replace(/_/g, " ")}
                </ActionButton>
              ))}
            <ActionButton tone="ghost" onClick={onEdit}>Edit</ActionButton>
          </div>
        </AudienceSection>
      )}

      {article.body && (
        <AudienceSection title="Content preview" meta="Article body">
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" }}>
            {article.body}
          </div>
        </AudienceSection>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function ContentModule() {
  const { userRole } = useAuthContext();
  const isAuthor = AUTHOR_ROLES.includes(userRole ?? "");
  const isModerator = MODERATOR_ROLES.includes(userRole ?? "");

  const [statusFilter, setStatusFilter] = useState<ContentArticle["status"] | "">("");
  const [selected, setSelected] = useState<ContentArticle | null>(null);
  const [editing, setEditing] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { articles, loading, error, reload } = useArticles(statusFilter);

  async function handleAction(id: string, status: ContentArticle["status"]) {
    try {
      await updateContentArticleStatus(id, status);
      reload();
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    } catch (e: any) { console.error("Status update failed", e.message); }
  }

  const statusCounts = articles.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ padding: 16, background: "color-mix(in srgb,#10b981 8%,transparent)", border: "1px solid color-mix(in srgb,#10b981 20%,transparent)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#10b981", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>📝 Blog & Content</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>Content Management</div>
        </div>
        {isAuthor && (
          <ActionButton tone="accent" onClick={() => { setShowNew(true); setSelected(null); setEditing(false); }}>
            + New Article
          </ActionButton>
        )}
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {(["draft", "pending_review", "approved", "published", "retracted"] as ContentArticle["status"][]).map(s => (
          <div key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)} style={{
            padding: 12, background: "var(--color-surface)",
            border: `1px solid ${statusFilter === s ? "var(--color-accent)" : "var(--color-border)"}`,
            borderRadius: 10, textAlign: "center", cursor: "pointer",
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>{statusCounts[s] ?? 0}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 4, textTransform: "capitalize" }}>{s.replace(/_/g, " ")}</div>
          </div>
        ))}
      </div>

      {showNew && (
        <ArticleEditor article={null} onSave={() => { setShowNew(false); reload(); }} onCancel={() => setShowNew(false)} />
      )}

      {!showNew && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)", gap: 16 }}>
          <AudienceSection title={`Articles (${articles.length})`} meta={statusFilter || "All statuses"}>
            {loading && <div style={{ padding: 16, color: "var(--color-text-muted)" }}>Loading…</div>}
            {error && <div style={{ padding: 16, color: "#ef4444", fontSize: 13 }}>{error}</div>}
            <div style={{ display: "grid", gap: 8, maxHeight: 600, overflowY: "auto" }}>
              {articles.map(a => (
                <button key={a.id} onClick={() => { setSelected(selected?.id === a.id ? null : a); setEditing(false); }} style={{
                  padding: 12, borderRadius: 10, textAlign: "left", cursor: "pointer",
                  border: selected?.id === a.id ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  background: selected?.id === a.id ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>{a.category ?? "Uncategorized"} · {a.author_name ?? "Unknown"}</div>
                    </div>
                    <StatusPill label={a.status.replace(/_/g, " ")} tone={STATUS_TONE[a.status]} />
                  </div>
                </button>
              ))}
              {!loading && articles.length === 0 && <EmptyState title="No articles" detail="No articles match the current filter." />}
            </div>
          </AudienceSection>

          <div>
            {selected && !editing && (
              <ArticleDetail article={selected} isModerator={isModerator} onAction={handleAction} onEdit={() => setEditing(true)} />
            )}
            {selected && editing && (
              <ArticleEditor article={selected} onSave={() => { setEditing(false); reload(); setSelected(null); }} onCancel={() => setEditing(false)} />
            )}
            {!selected && (
              <AudienceSection title="No article selected" meta="Select from the list">
                <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)" }}>
                  Select an article to view, edit, or advance through the moderation workflow.
                </div>
              </AudienceSection>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 } as const;
const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-surface-1)", color: "var(--color-text-primary)", fontSize: 13 } as const;
