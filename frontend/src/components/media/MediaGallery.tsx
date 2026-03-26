import { useState } from "react";

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  type: "image" | "video" | "document";
  uploadedAt: string;
  size: number;
}

interface MediaGalleryProps {
  items: MediaItem[];
  onDelete?: (id: string) => Promise<void>;
  onSelect?: (item: MediaItem) => void;
  viewOnly?: boolean;
}

export function MediaGallery({
  items,
  onDelete,
  onSelect,
  viewOnly = false
}: MediaGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSelect = (item: MediaItem) => {
    setSelectedId(item.id);
    onSelect?.(item);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await onDelete?.(id);
      setSelectedId(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(null);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return "🖼️";
      case "video":
        return "🎥";
      case "document":
        return "📄";
      default:
        return "📎";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: "clamp(20px, 5vw, 32px)",
          textAlign: "center",
          color: "var(--color-text-muted)",
          fontFamily: "'DM Mono', monospace",
          fontSize: "clamp(11px, 2vw, 13px)"
        }}
      >
        No media uploaded yet
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "clamp(8px, 2vw, 12px)"
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelect(item)}
            style={{
              position: "relative",
              border:
                selectedId === item.id
                  ? "2px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              transition: "all 140ms",
              background: "var(--color-surface-2)",
              aspectRatio: "1"
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (selectedId !== item.id) {
                el.style.borderColor = "var(--color-accent-dim)";
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (selectedId !== item.id) {
                el.style.borderColor = "var(--color-border)";
              }
            }}
          >
            {item.type === "image" && (
              <img
                src={item.url}
                alt={item.filename}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            )}

            {item.type === "video" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  fontSize: 32
                }}
              >
                {getFileIcon(item.type)}
              </div>
            )}

            {item.type === "document" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  fontSize: 32
                }}
              >
                {getFileIcon(item.type)}
              </div>
            )}

            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(0, 0, 0, 0.7)",
                padding: "6px 8px",
                fontSize: 10,
                color: "var(--color-text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "'DM Mono', monospace"
              }}
            >
              {item.filename}
            </div>

            {!viewOnly && selectedId === item.id && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                disabled={deleting === item.id}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  background: deleting === item.id ? "var(--color-danger-dim)" : "var(--color-danger)",
                  border: "none",
                  color: "white",
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  cursor: deleting === item.id ? "not-allowed" : "pointer",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  transition: "all 150ms",
                  opacity: deleting === item.id ? 0.6 : 1
                }}
                title={deleting === item.id ? "Deleting..." : "Delete media"}
              >
                {deleting === item.id ? "⏳" : "✕"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Info Panel for Selected Item */}
      {selectedId && (
        <div
          style={{
            marginTop: "clamp(12px, 3vw, 20px)",
            padding: "clamp(12px, 3vw, 16px)",
            borderRadius: 8,
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)"
          }}
        >
          {items.find((item) => item.id === selectedId) && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "clamp(8px, 2vw, 12px)"
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "clamp(12px, 2vw, 13px)",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      marginBottom: 4,
                      fontFamily: "'DM Mono', monospace"
                    }}
                  >
                    {items.find((item) => item.id === selectedId)?.filename}
                  </h3>
                  <div
                    style={{
                      fontSize: "clamp(10px, 1.8vw, 12px)",
                      color: "var(--color-text-muted)",
                      fontFamily: "'DM Mono', monospace"
                    }}
                  >
                    {formatFileSize(items.find((item) => item.id === selectedId)?.size ?? 0)} ·{" "}
                    {items.find((item) => item.id === selectedId)?.type}
                  </div>
                </div>
                {!viewOnly && onDelete && (
                  <button
                    onClick={() =>
                      handleDelete(items.find((item) => item.id === selectedId)?.id ?? "")
                    }
                    disabled={deleting === selectedId}
                    style={{
                      padding: "6px 12px",
                      background: "var(--color-danger)",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: deleting === selectedId ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "'DM Mono', monospace",
                      opacity: deleting === selectedId ? 0.6 : 1,
                      transition: "all 150ms"
                    }}
                  >
                    {deleting === selectedId ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
