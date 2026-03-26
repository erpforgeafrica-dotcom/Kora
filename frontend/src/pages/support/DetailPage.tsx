import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '@/components/ui/PageLayout';
import ActionMenu from '@/components/ui/ActionMenu';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/contexts/KoraToastContext';
import { apiClient, getApiErrorMessage } from '@/services/api';

interface SupportCase {
  id: string;
  customer_id?: string | null;
  customer_name?: string;
  channel: string;
  event: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  priority?: string;
  description?: string;
  assignee_id?: string | null;
  assignee_name?: string | null;
  resolution_note?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SupportCaseEvent {
  id: string;
  event_type: string;
  actor_user_id?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}

interface StaffOption {
  id: string;
  full_name: string;
}

interface AssigneeSelectProps {
  caseId: string;
  currentAssignee?: string | null;
  onError: (message: string) => void;
  onUpdate: () => void;
}

function AssigneeSelect({ caseId, currentAssignee, onError, onUpdate }: AssigneeSelectProps) {
  const [assignee, setAssignee] = useState(currentAssignee ?? '');
  const [staff, setStaff] = useState<StaffOption[]>([]);

  useEffect(() => {
    setAssignee(currentAssignee ?? '');
  }, [currentAssignee]);

  useEffect(() => {
    let active = true;

    apiClient.get<StaffOption[]>('/api/staff')
      .then((rows) => {
        if (active) {
          setStaff(rows);
        }
      })
      .catch(() => {
        if (active) {
          setStaff([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAssign = async () => {
    try {
      await apiClient.patch(`/api/support/cases/${caseId}/assignee`, {
        assignee_id: assignee || null,
      });
      onUpdate();
    } catch (err) {
      onError(getApiErrorMessage(err, 'Failed to assign support case'));
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)', minWidth: 180 }}
      >
        <option value="">Unassigned</option>
        {staff.map((staffMember) => (
          <option key={staffMember.id} value={staffMember.id}>
            {staffMember.full_name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleAssign}
        style={{
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface-2)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
        }}
      >
        Save
      </button>
    </div>
  );
}

export default function SupportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [caseData, setCaseData] = useState<SupportCase | null>(null);
  const [timeline, setTimeline] = useState<SupportCaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SupportCase['status']>('open');
  const [resolutionDraft, setResolutionDraft] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  function formatTimestamp(value?: string | null) {
    if (!value) return 'Not recorded';
    return new Date(value).toLocaleString();
  }

  const loadCase = async (caseId: string, silent = false) => {
    try {
      const [data, events] = await Promise.all([
        apiClient.get<SupportCase>(`/api/support/cases/${caseId}`),
        apiClient.get<SupportCaseEvent[]>(`/api/support/cases/${caseId}/timeline`).catch(() => []),
      ]);
      setCaseData(data);
      setTimeline(events);
      setStatus(data.status);
      setResolutionDraft(data.resolution_note ?? '');
    } catch (err) {
      if (!silent) {
        showToast(getApiErrorMessage(err, 'Failed to load support case'), 'error');
      }
    }
  };

  useEffect(() => {
    let active = true;

    if (!id) {
      setLoading(false);
      return undefined;
    }

    loadCase(id)
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const updateStatus = async (newStatus: typeof status) => {
    if (!id) return;
    try {
      await apiClient.patch(`/api/support/cases/${id}/status`, { status: newStatus });
      await loadCase(id, true);
      showToast('Status updated', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Update failed'), 'error');
    }
  };

  const addResolution = async () => {
    if (!id) return;
    const note = resolutionDraft.trim();
    if (!note) {
      showToast('Resolution note is required', 'error');
      return;
    }
    try {
      setSubmittingResolution(true);
      await apiClient.post(`/api/support/cases/${id}/resolution`, {
        resolution_note: note,
      });
      await loadCase(id, true);
      showToast('Resolution added', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to add resolution'), 'error');
    } finally {
      setSubmittingResolution(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading case...</div>;
  if (!caseData) return <div style={{ padding: 24 }}>Case not found</div>;

  return (
    <PageLayout title={`Case #${caseData.id}`} subtitle={caseData.customer_name ?? 'Customer'}>
      <div style={{ display: 'grid', gap: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, padding: 24, background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
          <div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 8 }}>Channel</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{caseData.channel}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 8 }}>Priority</div>
            <StatusBadge status={caseData.priority ?? 'low'} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 8 }}>Status</div>
            <StatusBadge status={caseData.status ?? 'open'} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 8 }}>Assignee</div>
            <AssigneeSelect
              caseId={caseData.id}
              currentAssignee={caseData.assignee_id}
              onError={(message) => showToast(message, 'error')}
              onUpdate={async () => {
                if (id) {
                  await loadCase(id, true);
                }
                showToast('Assignee updated', 'success');
              }}
            />
          </div>
          {caseData.description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 8 }}>Description</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{caseData.description}</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <ActionMenu items={[
            { label: 'Mark Assigned', onClick: () => updateStatus('assigned') },
            { label: 'Start Progress', onClick: () => updateStatus('in_progress') },
            { label: 'Mark Resolved', onClick: () => updateStatus('resolved') },
            { label: 'Close Case', onClick: () => updateStatus('closed') },
            { label: 'Add Resolution Note', onClick: addResolution }
          ]} />
        </div>
        <div style={{ display: 'grid', gap: 12, padding: 20, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Resolution workspace</div>
          <textarea
            value={resolutionDraft}
            onChange={(event) => setResolutionDraft(event.target.value)}
            rows={4}
            placeholder="Write the resolution note for this support case"
            style={{
              width: '100%',
              resize: 'vertical',
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-primary)'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={addResolution}
              disabled={submittingResolution || resolutionDraft.trim().length === 0}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-accent-dim)',
                color: 'var(--color-text-primary)',
                cursor: submittingResolution ? 'not-allowed' : 'pointer',
                opacity: submittingResolution || resolutionDraft.trim().length === 0 ? 0.6 : 1
              }}
            >
              {submittingResolution ? 'Saving...' : 'Save resolution'}
            </button>
          </div>
        </div>
        {caseData.resolution_note && (
          <div style={{ padding: 20, background: 'var(--color-accent-dim)', borderRadius: 12, borderLeft: '4px solid var(--color-accent)' }}>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 8 }}>Resolution</div>
            <div>{caseData.resolution_note}</div>
          </div>
        )}
        <div style={{ padding: 20, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 12 }}>Timeline</div>
          {timeline.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)' }}>No timeline events recorded yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {timeline.map((event) => (
                <div key={event.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{event.event_type}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {formatTimestamp(event.created_at)}
                  </div>
                  {event.details && Object.keys(event.details).length > 0 && (
                    <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
