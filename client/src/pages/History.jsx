import { useState, useEffect } from 'react';
import apiFetch from '../api';

export default function History() {
  const [data, setData] = useState({ orders: [], totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/orders/history')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading history...</div>;

  return (
    <div className="page-wide">
      <h1 className="page-title">📊 Order History</h1>
      <p className="page-subtitle">Your complete ledger across all events</p>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Total Revenue
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
            ₹{data.totalRevenue.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Total Orders
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {data.orders.length}
          </div>
        </div>
      </div>

      {data.orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No orders yet. Go live to start receiving orders!
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Event</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-light)' }}>
                    #{order._id.slice(-6).toUpperCase()}
                  </td>
                  <td>
                    <span className="badge badge-approved">{order.eventCode}</span>
                  </td>
                  <td>
                    {order.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{order.total}</td>
                  <td>
                    <span className={`badge badge-${order.status === 'completed' || order.status === 'ready' ? 'approved' : 'pending'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
