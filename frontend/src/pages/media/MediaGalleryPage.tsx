import { useEffect, useState } from "react";
import { AudienceSection, EmptyState, StatusPill } from "../../components/audience/AudiencePrimitives";

interface MediaAsset {
  id: string;
  filename: string;
  cdn_url: string;
  content_type: string;
  size_bytes: number;
  category: string;
  created_at: string;
}

const CATEGORIES = ["general", "gallery", "promotional", "before_after", "training", "logo"];

export function MediaGalleryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadAssets();
  }, [category]);

  const loadAssets = async () => {
    try {
      const url = category ? `/api/media?category=${category}` : "/api/media";
      const res = await fetch(url, {
        headers: { "X-Org-Id": localStorage.getItem("kora_org_id") || "" }
      });
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error("Failed to load media", err);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Get presigned URL
        const uploadRes = await fetch("/api/media/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Org-Id": localStorage.getItem("kora_org_id") || ""
          },
          body: JSON.stringify({
            filename: file.name,
            content_type: file.type,
            size_bytes: file.size,
            category: category || "general"
          })
        });

        const { asset_id, upload_url } = await uploadRes.json();

        // Upload file (mock for now - in production use actual S3 presigned URL)
        // await fetch(upload_url, { method: "PUT", body: file });

        // Mark as ready
        await fetch(`/api/media/${asset_id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Org-Id": localStorage.getItem("kora_org_id") || ""
          },
          body: JSON.stringify({ status: "ready" })
        });
      }

      await loadAssets();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>
          Media Gallery
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
          Upload and manage images, videos, and documents
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          onClick={() => setCategory(null)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: !category ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
            background: !category ? "var(--color-accent-dim)" : "var(--color-surface-2)",
            color: !category ? "var(--color-accent)" : "var(--color-text-muted)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: category === cat ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
              background: category === cat ? "var(--color-accent-dim)" : "var(--color-surface-2)",
              color: category === cat ? "var(--color-accent)" : "var(--color-text-muted)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          padding: 40,
          borderRadius: 16,
          border: dragActive ? "2px dashed var(--color-accent)" : "2px dashed var(--color-border)",
          background: dragActive ? "var(--color-accent-dim)" : "var(--color-surface-2)",
          textAlign: "center",
          marginBottom: 24,
          cursor: "pointer"
        }}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 }}>
          {uploading ? "Uploading..." : "Drop files here or click to browse"}
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          Supports images, videos, and documents
        </div>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={(e) => handleUpload(e.target.files)}
          style={{ display: "none" }}
        />
      </div>

      {assets.length === 0 ? (
        <EmptyState
          title="No media yet"
          detail="Upload images, videos, or documents to get started"
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {assets.map((asset) => (
            <div
              key={asset.id}
              style={{
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-2)",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  height: 160,
                  background: "var(--color-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48
                }}
              >
                {asset.content_type.startsWith("image/") ? "🖼️" : asset.content_type.startsWith("video/") ? "🎥" : "📄"}
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {asset.filename}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                  <StatusPill label={asset.category} tone="muted" />
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    {formatSize(asset.size_bytes)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
