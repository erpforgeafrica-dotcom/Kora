export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  url: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  thumbnailUrl?: string;
}

export interface MediaUploadProgress {
  fileId: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "failed";
}

export class MediaService {
  private baseUrl = "/api/media";

  async uploadFile(
    file: File,
    onProgress?: (progress: MediaUploadProgress) => void
  ): Promise<MediaFile> {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress({
            fileId: file.name,
            progress,
            status: "uploading"
          });
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          onProgress?.({
            fileId: file.name,
            progress: 100,
            status: "completed"
          });
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        onProgress?.({
          fileId: file.name,
          progress: 0,
          status: "failed"
        });
        reject(new Error("Upload failed"));
      });

      xhr.open("POST", this.baseUrl);
      xhr.send(formData);
    });
  }

  async uploadMultiple(
    files: File[],
    onProgress?: (progress: MediaUploadProgress) => void
  ): Promise<MediaFile[]> {
    const results = await Promise.allSettled(
      files.map((file) => this.uploadFile(file, onProgress))
    );
    return results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<MediaFile>).value);
  }

  async listFiles(type?: string): Promise<MediaFile[]> {
    const url = type ? `${this.baseUrl}?type=${type}` : this.baseUrl;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to list files");
    return response.json();
  }

  async getFile(id: string): Promise<MediaFile> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) throw new Error("Failed to get file");
    return response.json();
  }

  async deleteFile(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to delete file");
  }

  async generateThumbnail(fileId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${fileId}/thumbnail`);
    if (!response.ok) throw new Error("Failed to generate thumbnail");
    const data = await response.json();
    return data.url;
  }

  async shareFile(fileId: string, shareWith: string[]): Promise<{ url: string }> {
    const response = await fetch(`${this.baseUrl}/${fileId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareWith })
    });
    if (!response.ok) throw new Error("Failed to share file");
    return response.json();
  }
}

export const mediaService = new MediaService();
