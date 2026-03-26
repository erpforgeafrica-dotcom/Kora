import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface SocialPost {
  message: string;
  platforms: string[];
  media?: string[];
  scheduleTime?: string;
}

const PLATFORMS = [
  { id: "whatsapp", name: "WhatsApp", icon: "💬" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "facebook", name: "Facebook", icon: "f" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "pinterest", name: "Pinterest", icon: "📌" },
  { id: "snapchat", name: "Snapchat", icon: "👻" },
  { id: "twitter", name: "Twitter/X", icon: "𝕏" }
];

export function SocialPostComposer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SocialPost>({
    message: "",
    platforms: ["instagram", "facebook"],
    media: [],
    scheduleTime: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const message = e.target.value;
    setFormData(prev => ({ ...prev, message }));
    setCharCount(message.length);
  };

  const togglePlatform = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In a real app, you'd upload files and get back URLs
    const newMedia = Array.from(files).map(f => f.name);
    setFormData(prev => ({
      ...prev,
      media: [...(prev.media || []), ...newMedia]
    }));
  };

  const removeMedia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      setError("Post message cannot be empty");
      return;
    }
    if (formData.platforms.length === 0) {
      setError("Please select at least one platform");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to create post");
      navigate("/app/business-admin/social");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, color: "var(--color-text-primary)", margin: 0 }}>Create Social Post</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: 8 }}>Publish to multiple platforms at once</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
        {/* Message Editor */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: 24,
          display: "grid",
          gap: 12
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontSize: 14, color: "var(--color-text-primary)", fontWeight: 600 }}>
              Message
            </label>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {charCount} characters
            </span>
          </div>
          <textarea
            value={formData.message}
            onChange={handleMessageChange}
            placeholder="Write your message... (supports emojis and formatting)"
            style={{
              width: "100%",
              padding: "16px",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-text-primary)",
              fontFamily: "inherit",
              fontSize: 14,
              minHeight: 150,
              resize: "vertical",
              outline: "none"
            }}
          />
        </div>

        {/* Platform Selection */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: 24,
          display: "grid",
          gap: 12
        }}>
          <label style={{ fontSize: 14, color: "var(--color-text-primary)", fontWeight: 600 }}>
            Select Platforms
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
            {PLATFORMS.map(platform => (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                style={{
                  padding: "12px 16px",
                  background: formData.platforms.includes(platform.id) ? "var(--color-accent)" : "var(--color-surface-2)",
                  border: `1px solid ${formData.platforms.includes(platform.id) ? "var(--color-accent)" : "var(--color-border)"}`,
                  borderRadius: 8,
                  color: formData.platforms.includes(platform.id) ? "#0c0e14" : "var(--color-text-primary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 200ms",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <span style={{ fontSize: 16 }}>{platform.icon}</span>
                {platform.name}
              </button>
            ))}
          </div>
        </div>

        {/* Media Upload */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: 24,
          display: "grid",
          gap: 12
        }}>
          <label style={{ fontSize: 14, color: "var(--color-text-primary)", fontWeight: 600 }}>
            Media (Optional)
          </label>
          <div style={{
            padding: "24px",
            background: "var(--color-surface-2)",
            border: "2px dashed var(--color-border)",
            borderRadius: 8,
            textAlign: "center",
            cursor: "pointer",
            transition: "all 200ms"
          }}>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleMediaUpload}
              style={{ display: "none" }}
              id="media-upload"
            />
            <label
              htmlFor="media-upload"
              style={{
                display: "block",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                fontSize: 13
              }}
            >
              📸 Drop media here or click to upload
            </label>
          </div>

          {formData.media && formData.media.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12 }}>
              {formData.media.map((media, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    padding: "8px",
                    textAlign: "center"
                  }}
                >
                  <div style={{ color: "var(--color-text-muted)", fontSize: 12, wordBreak: "break-all" }}>
                    {media}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      width: 24,
                      height: 24,
                      background: "var(--color-danger)",
                      border: "none",
                      borderRadius: "50%",
                      color: "white",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: 24,
          display: "grid",
          gap: 12
        }}>
          <label style={{ fontSize: 14, color: "var(--color-text-primary)", fontWeight: 600 }}>
            Schedule (Optional)
          </label>
          <input
            type="datetime-local"
            value={formData.scheduleTime || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduleTime: e.target.value }))}
            style={{
              padding: "10px 12px",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-text-primary)",
              fontFamily: "inherit",
              fontSize: 14
            }}
          />
          <p style={{ color: "var(--color-text-muted)", fontSize: 12, margin: 0 }}>
            Leave empty to post immediately
          </p>
        </div>

        {error && (
          <div style={{
            padding: 12,
            background: "rgba(239, 68, 68, 0.06)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 6,
            color: "var(--color-danger)",
            fontSize: 12
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "12px 24px",
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-text-muted)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: "var(--color-accent)",
              border: "none",
              borderRadius: 8,
              color: "#0c0e14",
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
