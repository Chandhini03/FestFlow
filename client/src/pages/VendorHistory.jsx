import { useState, useEffect } from 'react';

export default function VendorHistory() {
  const [data, setData] = useState({ orders: [], totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`http://${window.location.hostname}:5005/api/orders/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.orders) setData(resData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading-screen" style={{padding: '2rem', textAlign: 'center'}}>Loading history...</div>;

  return (
    <div className="page-wide" style={{padding: '2rem'}}>
      <h1 className="page-title" style={{fontSize: '2rem', marginBottom: '0.5rem'}}>📊 Order History</h1>
      <p className="page-subtitle" style={{color: '#666', marginBottom: '2rem'}}>Your complete ledger across all events</p>

      <div className="card" style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '3rem', flexWrap: 'wrap', background: '#f8f9fa' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'bold' }}>
            Total Revenue
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'green' }}>
            ₹{data.totalRevenue.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'bold' }}>
            Total Orders
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#333' }}>
            {data.orders.length}
          </div>
        </div>
      </div>

      {data.orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#888', border: '1px dashed #ccc', borderRadius: '8px' }}>
          No orders yet. Go live to start receiving orders!
        </div>
      ) : (
        <div className="table-wrapper" style={{background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
            <thead style={{background: '#f1f3f5', borderBottom: '2px solid #ddd'}}>
              <tr>
                <th style={{padding: '1rem'}}>Order ID</th>
                <th style={{padding: '1rem'}}>Event</th>
                <th style={{padding: '1rem'}}>Items</th>
                <th style={{padding: '1rem'}}>Total</th>
                <th style={{padding: '1rem'}}>Status</th>
                <th style={{padding: '1rem'}}>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr key={order._id} style={{borderBottom: '1px solid #eee'}}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#0066cc' }}>
                    #{order._id.slice(-6).toUpperCase()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{padding: '0.2rem 0.5rem', background: '#e2e8f0', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold'}}>{order.eventCode}</span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    {order.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: 'green' }}>₹{order.totalAmount}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.85rem', 
                      fontWeight: 'bold',
                      background: (order.status === 'Completed' || order.status === 'Ready') ? '#d4edda' : '#fff3cd',
                      color: (order.status === 'Completed' || order.status === 'Ready') ? '#155724' : '#856404'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#888' }}>
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
