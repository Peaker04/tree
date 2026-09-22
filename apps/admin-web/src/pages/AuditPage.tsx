import React, { useState } from 'react';
import { Card, Badge, Button } from '../components/ui';

const MOCK_AUDIT = [
  { id: 'aud_1', timestamp: '2026-09-23T08:12:00Z', action: 'TASK_APPROVED', resourceId: 'TSK-1002', actor: 'manager.hq@novyx.vn', outcome: 'SUCCESS' },
  { id: 'aud_2', timestamp: '2026-09-23T08:15:00Z', action: 'CREDENTIAL_RESET_REQUESTED', resourceId: 'USR-04', actor: 'admin@novyx.vn', outcome: 'SUCCESS' },
  { id: 'aud_3', timestamp: '2026-09-23T09:00:12Z', action: 'ROLE_ASSIGNED', resourceId: 'USR-09', actor: 'admin@novyx.vn', outcome: 'FAILURE' },
];

export function AuditPage() {
  const [logs] = useState(MOCK_AUDIT);

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
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>Action</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>Resource</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>Actor</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--hairlineBorder)' }}>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--pewter)' }}>{new Date(l.timestamp).toLocaleString('vi-VN')}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600 }}>{l.action}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontFamily: 'monospace' }}>{l.resourceId}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px' }}>{l.actor}</td>
                <td style={{ padding: '16px 24px' }}>
                  <Badge status={l.outcome === 'SUCCESS' ? 'active' : 'suspended'}>{l.outcome}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
