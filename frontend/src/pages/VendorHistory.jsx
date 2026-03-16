import { useState, useEffect } from 'react';

export default function VendorHistory() {
  const [data, setData] = useState({ orders: [], totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`http://${window.location.hostname}:5000/api/orders/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.orders) setData(resData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ borderTopColor: 'var(--cherry-cola)' }}></div>
      <p style={{ marginTop: '1rem', fontWeight: '700', color: 'var(--cherry-cola)' }}>Crunching your numbers...</p>
    </div>
  );

  // Derive insights
  const itemSales = {};
  const hourlySales = {}; // 0-23
  
  data.orders.forEach(order => {
    // Items
    order.items.forEach(item => {
      itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
    });
    // Peak hours
    const hour = new Date(order.createdAt).getHours();
    hourlySales[hour] = (hourlySales[hour] || 0) + 1;
  });

  const sortedItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]);
  const topItem = sortedItems[0] || ["None", 0];
  
  const peakHour = Object.entries(hourlySales).sort((a, b) => b[1] - a[1])[0] || [null, 0];
  const peakTimeStr = peakHour[0] !== null ? `${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00` : "N/A";

  const chartMax = Math.max(...sortedItems.map(i => i[1]), 1);

  return (
    <div className="page-wide" style={{ padding: '2.5rem' }}>
      <h1 className="page-title" style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--cherry-cola)' }}>📊 Analytics</h1>
      <p className="page-subtitle" style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Your complete order history and revenue tracking</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ background: 'var(--cherry-cola)', border: 'none', color: 'white', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '5rem', opacity: 0.1 }}>💰</div>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', opacity: 0.8 }}>Total Revenue</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>₹{data.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="card" style={{ border: '2px solid var(--cherry-cola)', background: 'white', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '5rem', opacity: 0.05 }}>📦</div>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', color: 'var(--cherry-cola)' }}>Total Orders</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--cherry-dark)' }}>{data.orders.length}</div>
        </div>
        <div className="card" style={{ border: '2px solid var(--cherry-cola)', background: 'white', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '5rem', opacity: 0.05 }}>🔥</div>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', color: 'var(--cherry-cola)' }}>Top Seller</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--cherry-dark)', marginTop: '0.5rem' }}>{topItem[0]}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', opacity: 0.7 }}>{topItem[1]} units sold</div>
        </div>
        <div className="card" style={{ border: '2px solid var(--cherry-cola)', background: 'white', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '5rem', opacity: 0.05 }}>⏰</div>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', color: 'var(--cherry-cola)' }}>Peak Hours</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--cherry-dark)', marginTop: '0.5rem' }}>{peakTimeStr}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', opacity: 0.7 }}>Most active time</div>
        </div>
      </div>

      {sortedItems.length > 0 && (
        <div className="card" style={{ marginBottom: '2.5rem', border: '2px solid var(--cherry-cola)' }}>
          <h3 style={{ fontWeight: 900, color: 'var(--cherry-cola)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 Item Sales Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {sortedItems.map(([name, count], i) => (
              <div key={i} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: '700' }}>
                  <span>{name}</span>
                  <span style={{ color: 'var(--cherry-cola)' }}>{count} sold</span>
                </div>
                <div style={{ height: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(count / chartMax) * 100}%`, 
                    background: 'var(--cherry-cola)',
                    borderRadius: '10px',
                    transition: 'width 1s ease-out'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', border: '2px dashed var(--border)' }}>
          No orders recorded yet.
        </div>
      ) : (
        <div className="table-wrapper" style={{ border: '2px solid var(--cherry-cola)', background: 'white' }}>
          <table>
            <thead>
              <tr style={{ background: 'var(--cherry-cola)' }}>
                <th style={{ color: 'white' }}>ID</th>
                <th style={{ color: 'white' }}>Event</th>
                <th style={{ color: 'white' }}>Items</th>
                <th style={{ color: 'white' }}>Total</th>
                <th style={{ color: 'white' }}>Status</th>
                <th style={{ color: 'white' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 800, color: 'var(--cherry-cola)' }}>#{order._id.slice(-6).toUpperCase()}</td>
                  <td><span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--cherry-dark)' }}>{order.eventCode}</span></td>
                  <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                  </td>
                  <td style={{ fontWeight: 900, color: 'var(--cherry-dark)' }}>₹{order.totalAmount}</td>
                  <td>
                    <span className="badge" style={{ 
                      background: (order.status === 'Completed' || order.status === 'Ready') ? 'var(--success-bg)' : 'var(--warning-bg)',
                      color: (order.status === 'Completed' || order.status === 'Ready') ? 'var(--success)' : 'var(--warning)',
                      border: 'none'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
