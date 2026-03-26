import { useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";

interface UploadedFile {
  id: string;
  url: string;
  filename: string;
  category: string;
}

interface DragDropUploaderProps {
  category?: string;
  attachTo?: { type: "booking" | "client"; id: string };
  onUploadComplete?: (files: UploadedFile[]) => void;
}

export function DragDropUploader({ category = "general", attachTo, onUploadComplete }: DragDropUploaderProps) {
  const { orgId: organizationId } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    const uploaded: UploadedFile[] = [];

    for (const file of files) {
      try {
        const presignedRes = await fetch("/api/media/presigned-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-org-id": organizationId || "" },
          body: JSON.stringify({ filename: file.name, content_type: file.type })
        });

        const { upload_url, asset_id, public_url } = await presignedRes.json();

        await fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file
        });

        const metadata: any = {
          category: selectedCategory,
          size: file.size,
          mime_type: file.type
        };

        if (attachTo) {
          metadata[`${attachTo.type}_id`] = attachTo.id;
        }

        await fetch(`/api/media/${asset_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-org-id": organizationId || "" },
          body: JSON.stringify(metadata)
        });

        uploaded.push({ id: asset_id, url: public_url, filename: file.name, category: selectedCategory });
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }

    setUploadedFiles([...uploadedFiles, ...uploaded]);
    setUploading(false);

    if (onUploadComplete) {
      onUploadComplete(uploaded);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "block" }}>Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: "1px solid var(--color-border)", width: "100%" }}
        >
          <option value="general">General</option>
          <option value="profile">Profile</option>
          <option value="service">Service</option>
          <option value="document">Document</option>
          <option value="gallery">Gallery</option>
        </select>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(99, 102, 241, 0.05)" : "var(--color-surface)",
          transition: "all 0.2s"
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          {uploading ? "Uploading..." : "Drop files here or click to browse"}
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          Supports images, documents, and videos
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 600 }}>Uploaded Files</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
            {uploadedFiles.map((file) => (
              <div key={file.id} style={{ border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
                <img
                  src={file.url}
                  alt={file.filename}
                  style={{ width: "100%", height: 120, objectFit: "cover", background: "#f3f4f6" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='14'%3EFile%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div style={{ padding: 8, fontSize: 11, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.filename}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
