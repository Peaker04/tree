import { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../components/ui';
import type { GovernanceUserDto } from '@novyx/contracts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function UsersPage() {
  const [users, setUsers] = useState<GovernanceUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProvision, setShowProvision] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/v1/governance/users`)
      .then(res => res.json())
      .then(json => {
        setUsers(json.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>User Governance</h1>
          <p style={{ margin: '8px 0', color: 'var(--pewter)', fontSize: '14px' }}>
            Provision network credentials and assign operational roles.
          </p>
        </div>
        <Button onClick={() => setShowProvision(true)}>+ Cấp phát tài khoản</Button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--hairlineBorder)', backgroundColor: '#fafafa' }}>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>Email</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>Role</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--pewter)' }}>Loading...</td></tr>
            ) : users.length === 0 ? (
               <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--pewter)' }}>Không có dữ liệu</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--hairlineBorder)' }}>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500 }}>{u.email}</td>
                <td style={{ padding: '16px 24px', fontSize: '14px' }}>{u.role}</td>
                <td style={{ padding: '16px 24px' }}>
                  <Badge status={u.accountStatus === 'ACTIVE' ? 'active' : 'suspended'}>{u.accountStatus}</Badge>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <Button variant="outline">Manage</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showProvision && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Card style={{ width: '400px' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px' }}>Cấp phát tài khoản mới</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--pewter)', marginBottom: '8px' }}>Email Nội Bộ</label>
                <input style={{ width: '100%', padding: '8px', border: '1px solid var(--hairlineBorder)', borderRadius: 'var(--radius-control)' }} placeholder="name@novyx.vn" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--pewter)', marginBottom: '8px' }}>Vai Trò (Role)</label>
                <select style={{ width: '100%', padding: '8px', border: '1px solid var(--hairlineBorder)', borderRadius: 'var(--radius-control)', backgroundColor: '#fff' }}>
                  <option>Staff</option>
                  <option>Manager</option>
                  <option>Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button variant="ghost" onClick={() => setShowProvision(false)}>Hủy bỏ</Button>
                <Button onClick={() => setShowProvision(false)}>Cấp phát</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
