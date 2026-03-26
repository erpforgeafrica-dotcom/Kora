import { useState, useRef } from "react";
import type { MediaItem } from "./MediaGallery";

interface MediaUploadManagerProps {
  onUpload: (items: MediaItem[]) => Promise<void>;
  category: "service-gallery" | "staff-gallery" | "before-after" | "promotional" | "training";
  maxFiles?: number;
}

export function MediaUploadManager({
  onUpload,
  category,
  maxFiles = 10
}: MediaUploadManagerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter((f) =>
      /^(image|video|application)/.test(f.type)
    );

    setSelectedFiles((prev) => {
      const combined = [...prev, ...validFiles];
      return combined.slice(0, maxFiles);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => {
        const combined = [...prev, ...newFiles];
        return combined.slice(0, maxFiles);
      });
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      // Convert File[] to MediaItem[]
      const items: MediaItem[] = selectedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

      await onUpload(items);
      setSelectedFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(12px, 3vw, 16px)",
        padding: "clamp(16px, 4vw, 20px)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12
      }}
    >
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 6vw, 40px)",
          border: `2px dashed ${
            dragActive ? "var(--color-accent)" : "var(--color-border)"
          }`,
          borderRadius: 8,
          background: dragActive ? "var(--color-accent-soft)" : "transparent",
          cursor: "pointer",
          transition: "all 140ms ease"
        }}
      >
        <div style={{ fontSize: "clamp(24px, 6vw, 32px)", marginBottom: 12 }}>📤</div>
        <div style={{ fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Drag files here or click to browse
        </div>
        <div
          style={{
            fontSize: "clamp(10px, 2vw, 11px)",
            color: "var(--color-text-muted)",
            marginTop: 4,
            textAlign: "center"
          }}
        >
          Supported: Images, videos, documents (max {maxFiles} files)
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={handleChange}
        style={{ display: "none" }}
      />

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(6px, 2vw, 8px)"
          }}
        >
          <div style={{ fontSize: "clamp(11px, 2vw, 12px)", fontWeight: 700, color: "var(--color-text-muted)" }}>
            Selected ({selectedFiles.length}/{maxFiles})
          </div>
          {selectedFiles.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "clamp(6px, 1.5vw, 8px)",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                gap: 8,
                flexWrap: "wrap"
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "clamp(11px, 2vw, 12px)", color: "var(--color-text-primary)", wordBreak: "break-word" }}>
                  {file.name}
                </div>
                <div style={{ fontSize: "clamp(9px, 1.5vw, 10px)", color: "var(--color-text-muted)" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-danger)",
                  cursor: "pointer",
                  fontSize: "clamp(14px, 2vw, 16px)",
                  padding: "clamp(2px, 1vw, 4px)"
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || uploading}
        style={{
          padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)",
          background:
            selectedFiles.length === 0
              ? "var(--color-text-faint)"
              : "var(--color-accent)",
          color: selectedFiles.length === 0 ? "var(--color-text-faint)" : "white",
          border: "none",
          borderRadius: 6,
          fontSize: "clamp(11px, 2vw, 12px)",
          fontWeight: 700,
          cursor: selectedFiles.length === 0 ? "not-allowed" : "pointer",
          transition: "all 140ms ease"
        }}
      >
        {uploading ? "Uploading..." : "Upload Files"}
      </button>
    </div>
  );
}
