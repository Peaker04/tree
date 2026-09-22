import { useEffect, useState } from 'react';
import { Card, Badge } from '../components/ui';
import type { AuditEventDto } from '@novyx/contracts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function AuditPage() {
  const [logs, setLogs] = useState<AuditEventDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/v1/audit/events`)
      .then((res) => res.json())
      .then((json) => {
        setLogs(json.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Immutable Audit Trail</h1>
        <p style={{ margin: '8px 0 0 0', color: 'var(--pewter)', fontSize: '14px' }}>
          Compliance log of all operational and governance mutations.
        </p>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--hairlineBorder)', backgroundColor: '#fafafa' }}>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>Time</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>
                Action
              </th>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>
                Resource
              </th>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>Actor</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>
                Outcome
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--pewter)' }}>
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--pewter)' }}>
                  Không có dữ liệu audit
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--hairlineBorder)' }}>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--pewter)' }}>
                    {new Date(l.timestamp).toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600 }}>{l.action}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontFamily: 'monospace' }}>
                    {l.targetResourceId}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px' }}>{l.actorId}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <Badge status={l.outcome === 'SUCCESS' ? 'active' : 'suspended'}>{l.outcome}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
