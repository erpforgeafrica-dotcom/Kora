import { useCrud } from "@/hooks/useCrud";
import PageLayout from "@/components/ui/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import UploadZone from "@/components/media/UploadZone";
import { useState } from "react";

interface MediaAsset {
  id: string;
  filename: string;
  category: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

export default function MediaGalleryPage() {
  const { data, loading, error, refetch } = useCrud<MediaAsset>("/api/media");
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("general");

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    formData.append("category", category);

    try {
      await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
          "X-Organization-Id": localStorage.getItem("org_id") || "",
        }
      });
      await refetch();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Skeleton rows={8} />;

  return (
    <PageLayout title="Media Gallery">
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: "12px" }}>Upload Media</h3>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: 12, color: "#94a3b8" }}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "6px",
              background: "#1a1f2e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: "#e2e8f0",
            }}
          >
            <option value="general">General</option>
            <option value="gallery">Gallery</option>
            <option value="promotional">Promotional</option>
            <option value="before_after">Before/After</option>
            <option value="training">Training</option>
            <option value="logo">Logo</option>
          </select>
        </div>
        <UploadZone onUpload={handleUpload} />
        {uploading && <div style={{ marginTop: "12px", color: "#00e5c8" }}>Uploading...</div>}
      </div>

      {error && <div style={{ color: "#ef4444", marginBottom: "16px" }}>Error: {error}</div>}

      {!data?.length ? (
        <EmptyState message="No media uploaded yet" />
      ) : (
        <DataTable
          columns={[
            { accessorKey: "filename", header: "File" },
            { accessorKey: "category", header: "Category" },
            { accessorKey: "content_type", header: "Type" },
            { accessorKey: "size_bytes", header: "Size" },
          ]}
          data={data}
        />
      )}
    </PageLayout>
  );
}
