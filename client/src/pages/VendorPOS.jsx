import { useState, useEffect } from 'react';

export default function VendorPOS() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const fetchOrders = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:5005/api/orders/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data);
      else throw new Error(data.error);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://${window.location.hostname}:5005/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchOrders();
      else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const placed = orders.filter((o) => o.status === 'Awaiting Verification');
  const preparing = orders.filter((o) => o.status === 'Preparing');

  return (
    <div className="page-wide" style={{padding: '2rem'}}>
      <h1 className="page-title" style={{fontSize: '2rem', marginBottom: '0.5rem'}}>📋 Live POS</h1>
      <p className="page-subtitle" style={{color: '#666', marginBottom: '2rem'}}>
        Orders update every 3 seconds · {orders.length} active order{orders.length !== 1 ? 's' : ''}
      </p>

      {error && <div className="error-msg" style={{color: 'red', padding: '10px', background: '#fee', borderRadius: '5px', marginBottom: '1rem'}}>{error}</div>}

      <div className="kanban" style={{display: 'flex', gap: '1.5rem', overflowX: 'auto'}}>
        {/* Column: New Orders */}
        <div className="kanban-col" style={{flex: '1', minWidth: '300px', background: '#f8f9fa', padding: '1rem', borderRadius: '8px'}}>
          <div className="kanban-col-title" style={{fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #dee2e6'}}>
            🔔 New Orders ({placed.length})
          </div>
          {placed.length === 0 && (
            <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
              No new orders
            </p>
          )}
          {placed.map((order) => (
            <div className="kanban-card" key={order._id} style={{background: 'white', padding: '1rem', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '1rem'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0066cc' }}>
                  #{order._id.slice(-6).toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  {new Date(order.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.quantity}× {item.name}</span>
                    <span style={{ color: '#666' }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'green' }}>₹{order.totalAmount}</span>
                <button className="btn btn-success" style={{padding: '0.4rem 0.8rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'}} onClick={() => updateStatus(order._id, 'Preparing')}>
                  ✓ Approve
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Column: Preparing */}
        <div className="kanban-col" style={{flex: '1', minWidth: '300px', background: '#f8f9fa', padding: '1rem', borderRadius: '8px'}}>
          <div className="kanban-col-title" style={{fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #dee2e6'}}>
            🔥 Preparing ({preparing.length})
          </div>
          {preparing.length === 0 && (
            <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
              No orders preparing
            </p>
          )}
          {preparing.map((order) => (
            <div className="kanban-card" key={order._id} style={{background: 'white', padding: '1rem', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '1rem', borderLeft: '3px solid #ffc107'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0066cc' }}>
                  #{order._id.slice(-6).toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  📱 {order.customerPhone}
                </span>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.quantity}× {item.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'green' }}>₹{order.totalAmount}</span>
                <button className="btn btn-primary" style={{padding: '0.4rem 0.8rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'}} onClick={() => updateStatus(order._id, 'Ready')}>
                  🎉 Ready
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
