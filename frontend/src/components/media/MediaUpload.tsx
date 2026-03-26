import { useRef, useState } from "react";

interface MediaUploadProps {
  onFilesSelected: (files: File[]) => Promise<void>;
  acceptedFormats?: string;
  maxFileSize?: number;
  multiple?: boolean;
}

export function MediaUpload({
  onFilesSelected,
  acceptedFormats = "image/*,video/*,application/pdf",
  maxFileSize = 50 * 1024 * 1024,
  multiple = true
}: MediaUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const errors: string[] = [];
    const valid: File[] = [];

    files.forEach(file => {
      if (file.size > maxFileSize) {
        errors.push(`${file.name} exceeds 50MB limit`);
      } else {
        valid.push(file);
      }
    });

    return { valid, errors };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      setError(errors.join("; "));
      return;
    }

    setError(null);
    setUploading(true);

    try {
      await onFilesSelected(valid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      style={{
        border: `2px dashed ${isDragActive ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: 12,
        padding: 32,
        textAlign: "center",
        cursor: "pointer",
        transition: "all 200ms",
        background: isDragActive ? "var(--color-accent-soft)" : "transparent"
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedFormats}
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
      />

      <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
      <div
        style={{
          fontSize: 14,
          color: "var(--color-text-primary)",
          marginBottom: 4,
          fontWeight: 600
        }}
      >
        Drop files here or click to select
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
        Supports: JPG, PNG, MP4, PDF · Max 50MB per file
      </div>

      {uploading && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--color-accent)",
            fontFamily: "'DM Mono', monospace"
          }}
        >
          ◉ Uploading...
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--color-danger)",
            fontFamily: "'DM Mono', monospace"
          }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
