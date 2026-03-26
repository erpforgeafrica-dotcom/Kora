# PHASE 4: SPRINT 1 IMPLEMENTATION GUIDE
## Navigation Accordion + Media Upload System
**Timeline**: Week 1 (Mon-Fri) | **Effort**: 30 hours | **Target**: Both systems live

---

## PHASE 4.1: ACCORDION SIDEBAR NAVIGATION

### Current State
- Simple collapse/expand sidebar (220px/56px toggle)
- Single flat nav items list (8 items)
- No section grouping

### Target State
```
┌─────────────────┐
│ ◈ Command       │  ← Always visible
├─────────────────┤
│ ▶ BOOKINGS      │  ← Collapsed section
│  ◷ Commands     │     (hidden)
│  ◷ Reservations │
│  ◷ Cancellations│
├─────────────────┤
│ ▼ CLINICAL      │  ← Open section
│  ✚ Patients     │     (expanded)
│  ✚ Referrals    │
│  ✚ History      │
├─────────────────┤
│ ⚡ EMERGENCY    │  ← Collapsed section
│  ... (hidden)   │
└─────────────────┘
```

### Implementation

**File: `frontend/src/components/layout/AccordionNavigation.tsx`**

```typescript
import { useState, type ReactNode } from "react";
import { useTheme } from "../../contexts/ThemeContext";

interface NavSection {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "command",
    label: "COMMAND",
    icon: "◈",
    items: [
      { key: "dashboard", label: "Dashboard", icon: "◈", path: "/app" }
    ]
  },
  {
    id: "bookings",
    label: "BOOKINGS",
    icon: "◷",
    items: [
      { key: "commands", label: "Commands", icon: "◷", path: "/app/bookings" },
      { key: "reservations", label: "Reservations", icon: "◷", path: "/app/bookings/reserved" },
      { key: "cancellations", label: "Cancellations", icon: "◷", path: "/app/bookings/cancelled" }
    ]
  },
  {
    id: "clinical",
    label: "CLINICAL",
    icon: "✚",
    items: [
      { key: "patients", label: "Patients", icon: "✚", path: "/app/clinical" },
      { key: "referrals", label: "Referrals", icon: "✚", path: "/app/clinical/referrals" },
      { key: "history", label: "History", icon: "✚", path: "/app/clinical/history" }
    ]
  },
  {
    id: "emergency",
    label: "EMERGENCY",
    icon: "⚡",
    items: [
      { key: "alerts", label: "Alerts", icon: "⚡", path: "/app/emergency" },
      { key: "response", label: "Response", icon: "⚡", path: "/app/emergency/response" },
      { key: "history", label: "History", icon: "⚡", path: "/app/emergency/history" }
    ]
  },
  {
    id: "finance",
    label: "FINANCE",
    icon: "◎",
    items: [
      { key: "overview", label: "Overview", icon: "◎", path: "/app/finance" },
      { key: "transactions", label: "Transactions", icon: "◎", path: "/app/finance/transactions" },
      { key: "reports", label: "Reports", icon: "◎", path: "/app/finance/reports" }
    ]
  },
  {
    id: "insights",
    label: "AI INSIGHTS",
    icon: "◉",
    items: [
      { key: "analytics", label: "Analytics", icon: "◉", path: "/app/insights" },
      { key: "predictions", label: "Predictions", icon: "◉", path: "/app/insights/predictions" },
      { key: "recommendations", label: "Recommendations", icon: "◉", path: "/app/insights/recommendations" }
    ]
  }
];

interface AccordionNavigationProps {
  collapsed: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function AccordionNavigation({
  collapsed,
  currentPath,
  onNavigate
}: AccordionNavigationProps) {
  const { themeId } = useTheme();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  return (
    <nav style={{
      display: "flex",
      flexDirection: "column",
      gap: 4,
      padding: "8px 0"
    }}>
      {NAV_SECTIONS.map(section => (
        <div key={section.id}>
          {/* Section Header (Always Visible) */}
          <button
            onClick={(e) => toggleSection(section.id, e)}
            style={{
              width: "100%",
              padding: collapsed ? "11px 12px" : "11px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: openSection === section.id 
                ? "var(--color-accent-soft)" 
                : "transparent",
              border: "none",
              color: openSection === section.id 
                ? "var(--color-accent)" 
                : "var(--color-text-muted)",
              cursor: "pointer",
              transition: "all 140ms ease",
              borderRadius: 8,
              margin: "2px 8px",
              fontSize: 13,
              fontFamily: "'DM Mono', monospace",
              whiteSpace: "nowrap",
              overflow: "hidden"
            }}
            title={collapsed ? section.label : undefined}
          >
            <span style={{ minWidth: 24, textAlign: "center" }}>
              {openSection === section.id ? "▼" : "▶"}
            </span>
            <span style={{
              fontSize: 13,
              opacity: collapsed ? 0 : 1,
              transition: "opacity 150ms"
            }}>
              {section.label}
            </span>
          </button>

          {/* Section Items (Expandable) */}
          {!collapsed && openSection === section.id && (
            <div style={{
              paddingLeft: 32,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              animation: "slideDown 200ms ease"
            }}>
              {section.items.map(item => (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.path)}
                  style={{
                    width: "calc(100% - 16px)",
                    padding: "8px 14px",
                    marginLeft: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: currentPath === item.path
                      ? "var(--color-accent-dim)"
                      : "transparent",
                    border: currentPath === item.path
                      ? "1px solid var(--color-accent)"
                      : "1px solid transparent",
                    color: currentPath === item.path
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                    cursor: "pointer",
                    transition: "all 140ms ease",
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "'DM Mono', monospace",
                    whiteSpace: "nowrap",
                    overflow: "hidden"
                  }}
                  onMouseEnter={(e) => {
                    if (currentPath !== item.path) {
                      (e.target as HTMLElement).style.background = "var(--color-accent-soft)";
                      (e.target as HTMLElement).style.color = "var(--color-text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPath !== item.path) {
                      (e.target as HTMLElement).style.background = "transparent";
                      (e.target as HTMLElement).style.color = "var(--color-text-secondary)";
                    }
                  }}
                >
                  <span style={{ minWidth: 20, textAlign: "center" }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

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
    </nav>
  );
}
```

**Update: `frontend/src/components/layout/AppShell.tsx`**

Import and use `AccordionNavigation` instead of flat nav items list.

---

## PHASE 4.2: MEDIA UPLOAD & GALLERY SYSTEM

### Current State
- No media handling
- No file uploads
- No galleries

### Target State

**Media Upload Component (drag-drop, multiple formats)**
```
┌─────────────────────────────────┐
│ UPLOAD MEDIA                    │
├─────────────────────────────────┤
│  📁 Drop files here             │
│     or click to select          │
│                                 │
│  Supports: JPG, PNG, MP4, PDF   │
│  Max: 50MB per file             │
└─────────────────────────────────┘
```

**Media Gallery (business admin)**
```
┌───────────────────────────────────┐
│ SERVICE GALLERY (180 items)       │
├───────────────────────────────────┤
│  [Img] [Img] [Img] [Img]       │
│  [Img] [Img] [Img] [Img]       │
│  ...                           │
│                                │
│  [Upload More] [Edit] [Delete] │
└───────────────────────────────────┘
```

### Implementation

**File: `frontend/src/components/media/MediaUpload.tsx`**

```typescript
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
    <div style={{
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
      <div style={{ fontSize: 14, color: "var(--color-text-primary)", marginBottom: 4 }}>
        Drop files here or click to select
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
        Supports: JPG, PNG, MP4, PDF · Max 50MB per file
      </div>

      {uploading && (
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--color-accent)" }}>
          Uploading...
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--color-danger)" }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
```

**File: `frontend/src/components/media/MediaGallery.tsx`**

```typescript
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
  viewOnly?: boolean;
}

export function MediaGallery({ items, onDelete, viewOnly = false }: MediaGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  if (items.length === 0) {
    return (
      <div style={{
        padding: 32,
        textAlign: "center",
        color: "var(--color-text-muted)"
      }}>
        No media uploaded yet
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: 12
    }}>
      {items.map(item => (
        <div
          key={item.id}
          onClick={() => setSelectedId(item.id)}
          style={{
            position: "relative",
            border: selectedId === item.id ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
            borderRadius: 8,
            overflow: "hidden",
            cursor: "pointer",
            transition: "all 140ms",
            background: "var(--color-surface-2)",
            aspectRatio: "1"
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent)";
          }}
          onMouseLeave={(e) => {
            if (selectedId !== item.id) {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
            }
          }}
        >
          {item.type === "image" ? (
            <img
              src={item.url}
              alt={item.filename}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              fontSize: 32
            }}>
              {getFileIcon(item.type)}
            </div>
          )}

          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(0, 0, 0, 0.7)",
            padding: "8px",
            fontSize: 11,
            color: "var(--color-text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {item.filename}
          </div>

          {!viewOnly && selectedId === item.id && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                background: "var(--color-danger)",
                border: "none",
                color: "white",
                width: 24,
                height: 24,
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

**File: `frontend/src/pages/audience/MediaManagerPage.tsx`**

```typescript
import { useState } from "react";
import { MediaUpload } from "../../components/media/MediaUpload";
import { MediaGallery, type MediaItem } from "../../components/media/MediaGallery";

export function MediaManagerPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedGallery, setSelectedGallery] = useState("service");

  const handleFilesSelected = async (files: File[]) => {
    // TODO: Upload to S3 or backend
    // For now, create local URLs
    const newItems = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      filename: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image") 
        ? "image" as const
        : file.type.startsWith("video")
        ? "video" as const
        : "document" as const,
      uploadedAt: new Date().toISOString(),
      size: file.size
    }));

    setItems([...newItems, ...items]);
  };

  const handleDelete = async (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: 24
      }}>
        <h1 style={{ fontSize: 20, marginBottom: 20, color: "var(--color-text-primary)" }}>
          Media Manager
        </h1>

        {/* Gallery Selection */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["service", "staff", "before-after", "promotional", "training"].map(gal => (
            <button
              key={gal}
              onClick={() => setSelectedGallery(gal)}
              style={{
                padding: "8px 16px",
                background: selectedGallery === gal 
                  ? "var(--color-accent)" 
                  : "var(--color-surface-2)",
                border: `1px solid ${selectedGallery === gal 
                  ? "var(--color-accent)" 
                  : "var(--color-border)"}`,
                color: selectedGallery === gal 
                  ? "var(--color-bg)" 
                  : "var(--color-text-secondary)",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase"
              }}
            >
              {gal.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* Upload Area */}
        <div style={{ marginBottom: 24 }}>
          <MediaUpload onFilesSelected={handleFilesSelected} />
        </div>

        {/* Gallery Display */}
        <h2 style={{ fontSize: 14, marginBottom: 16, color: "var(--color-text-muted)" }}>
          {selectedGallery.toUpperCase()} ({items.length} items)
        </h2>
        <MediaGallery items={items} onDelete={handleDelete} />
      </div>
    </div>
  );
}
```

---

## INTEGRATION CHECKLIST

**Phase 4.1 (Accordion Navigation)**
- [ ] Create `AccordionNavigation.tsx` component
- [ ] Update `AppShell.tsx` to use accordion
- [ ] Add nav section grouping logic
- [ ] Test all sections expand/collapse
- [ ] Test smooth animations
- [ ] Test collapsed state (icons only)

**Phase 4.2 (Media Upload)**
- [ ] Create `MediaUpload.tsx` component
- [ ] Create `MediaGallery.tsx` component
- [ ] Create `MediaManagerPage.tsx`
- [ ] Add route `/app/media` to App.tsx
- [ ] Test drag-drop uploads
- [ ] Test file validation (size, format)
- [ ] Test gallery display
- [ ] Test delete functionality
- [ ] Integrate S3 upload (optional, can use local URLs for dev)

---

## BUILD VERIFICATION

```bash
npm run build  # Must have zero errors
npm run dev    # Test both features live
```

**Success Criteria:**
- ✅ Accordion nav expands/collapses smoothly
- ✅ Only one section open at a time
- ✅ Media upload accepts drag-drop and click
- ✅ Gallery displays all media types
- ✅ No TypeScript errors
- ✅ All animations smooth (60fps)

---

## NEXT STEPS (After Week 1)

**Week 2:**
- Phase 4.3: Live Dashboard Widgets (bookings, revenue, alerts)
- Phase 4.4: KÓRA Smart Chatbot (context-aware assistant)

**Week 3:**
- Phase 4.5: Social Media Integration (WhatsApp, Instagram, etc.)

**Week 4:**
- Phase 4.6: Interactive Maps (GPS tracking, dispatch)

---

**Ready to begin implementation?** Yes → Start Phase 4.1 Accordion Navigation
