interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export default function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  isDangerous = false,
}: ConfirmModalProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#1a1f2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        color: '#e2e8f0',
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: 16, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: '0 0 24px 0', color: '#94a3b8', fontSize: 14 }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              background: isDangerous ? '#ef4444' : '#00e5c8',
              border: 'none',
              borderRadius: '6px',
              color: isDangerous ? '#fff' : '#000',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
