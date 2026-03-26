import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MediaUpload } from "../../components/media/MediaUpload";
import { MediaGallery, type MediaItem } from "../../components/media/MediaGallery";

const GALLERY_TYPES = [
  { id: "service", label: "Service Gallery", description: "Service photos and demonstrations" },
  { id: "staff", label: "Staff Portfolio", description: "Staff work and experience photos" },
  { id: "before-after", label: "Before/After", description: "Before and after transformation photos" },
  { id: "promotional", label: "Promotional", description: "Marketing and promotional materials" },
  { id: "training", label: "Training Videos", description: "Educational and training content" }
];

export default function MediaManagerPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedGallery, setSelectedGallery] = useState("service");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    // In production, these would be uploaded to S3 and return presigned URLs
    const newItems = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      filename: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image")
        ? ("image" as const)
        : file.type.startsWith("video")
          ? ("video" as const)
          : ("document" as const),
      uploadedAt: new Date().toISOString(),
      size: file.size
    }));

    setItems([...newItems, ...items]);
    setSuccessMessage(`✓ Added ${files.length} file(s) to ${selectedGallery}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDelete = async (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    setSuccessMessage("✓ Media deleted");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const currentGallery = GALLERY_TYPES.find((g) => g.id === selectedGallery);
  const galleryItems = items.filter((item) => item.type !== "document" || selectedGallery === "training");

  return (
    <div
      style={{
        padding: 24,
        minHeight: "calc(100vh - 80px)",
        background: "var(--color-bg)"
      }}
    >
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: 8,
            fontFamily: "'Space Grotesk', sans-serif"
          }}
        >
          Media Manager
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--color-text-secondary)",
            fontFamily: "'DM Mono', monospace"
          }}
        >
          Upload and manage media across all business galleries
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            background: "var(--color-success-dim)",
            border: "1px solid var(--color-success)",
            borderRadius: 8,
            color: "var(--color-success)",
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            animation: "slideDown 200ms ease"
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Gallery Selection Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          overflowX: "auto",
          paddingBottom: 8
        }}
      >
        {GALLERY_TYPES.map((gallery) => (
          <button
            key={gallery.id}
            onClick={() => setSelectedGallery(gallery.id)}
            style={{
              padding: "10px 16px",
              background:
                selectedGallery === gallery.id
                  ? "var(--color-accent)"
                  : "var(--color-surface-2)",
              border:
                selectedGallery === gallery.id
                  ? "1px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
              color:
                selectedGallery === gallery.id
                  ? "var(--color-bg)"
                  : "var(--color-text-secondary)",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              fontFamily: "'DM Mono', monospace",
              transition: "all 140ms",
              whiteSpace: "nowrap"
            }}
          >
            {gallery.label}
          </button>
        ))}
      </div>

      {/* Gallery Content */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: 24
        }}
      >
        {/* Gallery Info */}
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: 4,
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            {currentGallery?.label}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-muted)",
              fontFamily: "'DM Mono', monospace"
            }}
          >
            {currentGallery?.description} · {galleryItems.length} items
          </p>
        </div>

        {/* Upload Area */}
        <div style={{ marginBottom: 28 }}>
          <h3
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              fontFamily: "'DM Mono', monospace",
              marginBottom: 12,
              letterSpacing: "0.06em"
            }}
          >
            Upload Media
          </h3>
          <MediaUpload onFilesSelected={handleFilesSelected} />
        </div>

        {/* Gallery Display */}
        <div>
          <h3
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              fontFamily: "'DM Mono', monospace",
              marginBottom: 12,
              letterSpacing: "0.06em"
            }}
          >
            Gallery
          </h3>
          <MediaGallery items={galleryItems} onDelete={handleDelete} />
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
