import { useState } from 'react';

export default function UploadZone({ onUpload }: { onUpload: (files: File[]) => void }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    onUpload(files);
  };

  return (
    <div
      onDragOver={() => setIsDragActive(true)}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      style={{
        padding: '32px',
        border: `2px dashed ${isDragActive ? '#00e5c8' : '#64748b'}`,
        borderRadius: '8px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: isDragActive ? 'rgba(0,229,200,0.05)' : 'transparent',
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: 14 }}>Drag files here or click to upload</div>
      <input
        type="file"
        multiple
        onChange={(e) => onUpload(Array.from(e.target.files || []))}
        style={{ display: 'none' }}
        id="file-input"
      />
      <label htmlFor="file-input" style={{ cursor: 'pointer' }}>Click to browse</label>
    </div>
  );
}
