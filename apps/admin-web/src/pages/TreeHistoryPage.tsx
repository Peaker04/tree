import { useState } from 'react';
import { Card, Button } from '../components/ui';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const token = localStorage.getItem('admin_access_token') || '';
const headers = { Authorization: 'Bearer ' + token };

export function TreeHistoryPage() {
  const [treeId, setTreeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[] | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (!treeId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/v1/trees/${treeId}/care-history`, { headers });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Không tìm thấy cây');
        throw new Error('Lỗi fetch lịch sử chăm sóc');
      }
      const json = await res.json();
      setHistory(json.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Tài sản Cây Xanh (Trees)</h1>
        <p style={{ margin: '8px 0', color: 'var(--pewter)', fontSize: '14px' }}>
          Tra cứu lịch sử bảo dưỡng và theo dõi sức khỏe cây hiện trường.
        </p>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            value={treeId}
            onChange={(e) => setTreeId(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid var(--hairlineBorder)',
              borderRadius: 'var(--radius-control)',
              fontSize: '15px',
            }}
            placeholder="Nhập mã QR hoặc ID cây (VD: TRE-221)"
          />
          <Button onClick={fetchHistory}>{loading ? 'Đang tra cứu...' : 'Tra cứu lịch sử'}</Button>
        </div>
        {error && <div style={{ color: 'var(--danger)', marginTop: '12px', fontSize: '14px' }}>{error}</div>}
      </Card>

      {history && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairlineBorder)', backgroundColor: '#fafafa' }}>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>
                  Thời gian (Timestamp)
                </th>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>
                  Loại tác vụ (Task Type)
                </th>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>
                  Nhân viên (Staff)
                </th>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--pewter)', fontWeight: 500 }}>
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--pewter)' }}>
                    Chưa có lịch sử chăm sóc
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--hairlineBorder)' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500 }}>
                      {new Date(h.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>{h.taskType}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>{h.staffId}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--pewter)' }}>{h.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
