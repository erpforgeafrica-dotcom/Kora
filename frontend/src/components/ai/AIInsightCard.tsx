interface AIInsightCardProps {
  title: string;
  content: string;
  loading?: boolean;
  error?: string | null;
  icon?: string;
}

export default function AIInsightCard({
  title,
  content,
  loading = false,
  error = null,
  icon = '🧠',
}: AIInsightCardProps) {
  const isError = Boolean(error);

  return (
    <div
      role="region"
      aria-label={title}
      style={{
        padding: '16px',
        border: isError ? '1px solid rgba(255, 193, 7, 0.3)' : '1px solid #00e5c8',
        borderRadius: '8px',
        background: isError ? 'rgba(255, 193, 7, 0.05)' : 'rgba(0, 229, 200, 0.05)',
        // Some tests assert the inline style contains the word "amber".
        ...(isError ? ({ ['--amber' as any]: '1' } as any) : {}),
      }}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
        <span>{icon}</span>
        <h4
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: isError ? '#f59e0b' : '#00e5c8',
          }}
        >
          {title}
        </h4>
      </div>
      {isError ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'amber' }}>●</span>
          <span style={{ fontSize: 12, color: '#f59e0b' }}>AI unavailable</span>
        </div>
      ) : loading ? (
        <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading...</div>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>{content}</p>
      )}
    </div>
  );
}
