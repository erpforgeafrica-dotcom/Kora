import { useState } from "react";
import { MediaUploadManager } from "../../components/media/MediaUploadManager";
import { MediaGallery } from "../../components/media/MediaGallery";
import type { MediaItem } from "../../components/media/MediaGallery";

type CategoryTab = "service-gallery" | "staff-gallery" | "before-after" | "promotional" | "training";

const CATEGORIES: { id: CategoryTab; label: string; icon: string }[] = [
  { id: "service-gallery", label: "Service Gallery", icon: "🏢" },
  { id: "staff-gallery", label: "Staff Work Gallery", icon: "👥" },
  { id: "before-after", label: "Before/After", icon: "↔️" },
  { id: "promotional", label: "Promotional", icon: "📢" },
  { id: "training", label: "Training Media", icon: "🎓" }
];

export function MediaManagerPage() {
  const [activeTab, setActiveTab] = useState<CategoryTab>("service-gallery");
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);

  const handleUpload = async (items: MediaItem[]) => {
    // In production, this would upload to S3/cloud storage
    // For now, just add to local state
    setMediaList((prev) => [...prev, ...items]);
  };

  const handleDelete = async (id: string) => {
    // In production, this would delete from cloud storage
    setMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div style={{ padding: "clamp(12px, 4vw, 24px)" }}>
      {/* Header */}
      <div style={{ marginBottom: "clamp(20px, 6vw, 32px)" }}>
        <div
          style={{
            fontSize: "clamp(10px, 2vw, 12px)",
            letterSpacing: "0.12em",
            color: "var(--color-accent)",
            fontFamily: "'DM Mono', monospace",
            marginBottom: 10,
            fontWeight: 700
          }}
        >
          MEDIA MANAGEMENT
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(20px, 6vw, 28px)",
            color: "var(--color-text-primary)",
            fontFamily: "'Space Grotesk', sans-serif"
          }}
        >
          Media Gallery Manager
        </h1>
        <p
          style={{
            margin: "10px 0 0",
            fontSize: "clamp(12px, 3vw, 14px)",
            color: "var(--color-text-muted)"
          }}
        >
          Upload and manage images, videos, and documents across service categories.
        </p>
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: 12,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              border: "none",
              background:
                activeTab === cat.id
                  ? "var(--color-accent-soft)"
                  : "transparent",
              color:
                activeTab === cat.id
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)",
              borderBottom:
                activeTab === cat.id
                  ? "2px solid var(--color-accent)"
                  : "2px solid transparent",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
              transition: "all 140ms ease",
              whiteSpace: "nowrap"
            }}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "clamp(16px, 4vw, 24px)"
        }}
      >
        {/* Upload Manager */}
        <div>
          <div
            style={{
              fontSize: "clamp(11px, 2vw, 12px)",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              marginBottom: 12,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.12em"
            }}
          >
            UPLOAD FILES
          </div>
          <MediaUploadManager
            category={activeTab}
            onUpload={handleUpload}
            maxFiles={20}
          />
        </div>

        {/* Gallery */}
        <div>
          <div
            style={{
              fontSize: "clamp(11px, 2vw, 12px)",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              marginBottom: 12,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.12em"
            }}
          >
            GALLERY ({mediaList.length})
          </div>
          <MediaGallery
            items={mediaList}
            onDelete={handleDelete}
            viewOnly={false}
          />
        </div>
      </div>
    </div>
  );
}
