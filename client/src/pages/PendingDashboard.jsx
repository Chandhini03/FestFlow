import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function PendingDashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [eventCode, setEventCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Menu Builder State
  const [inventory, setInventory] = useState(user?.inventory || []);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemStock, setNewItemStock] = useState('');

  // Go Live state (for approved vendors)
  const [liveCode, setLiveCode] = useState(user?.currentEventCode || '');
  const [liveLoading, setLiveLoading] = useState(false);

  const isPending = user?.approvalStatus === 'pending';
  const token = localStorage.getItem('token');

  const refreshUser = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:5005/api/vendors/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...data, role: 'vendor' };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setInventory(data.inventory || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5005/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      setEventCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = async () => {
    setError('');
    setMessage('');
    setLiveLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5005/api/vendors/live`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventCode: liveCode, goLive: !user.isLive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setLiveLoading(false);
    }
  };

  const saveMenu = async (updatedInventory) => {
    try {
      const res = await fetch(`http://${window.location.hostname}:5005/api/vendors/menu`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inventory: updatedInventory }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      await refreshUser();
      setMessage('Menu updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const newItem = { name: newItemName, price: Number(newItemPrice), stock: Number(newItemStock) };
    const newInventory = [...inventory, newItem];
    setInventory(newInventory);
    saveMenu(newInventory);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemStock('');
  };

  const handleDeleteItem = (index) => {
    const newInventory = inventory.filter((_, i) => i !== index);
    setInventory(newInventory);
    saveMenu(newInventory);
  };

  return (
    <div className="page" style={{padding: '2rem', maxWidth: '800px', margin: '0 auto'}}>
      <h1 className="page-title" style={{fontSize: '2rem', marginBottom: '1rem'}}>
        {isPending ? '⏳ Waiting Room & Builder' : `🏪 ${user?.name}`}
      </h1>
      <p className="page-subtitle" style={{color: '#666', marginBottom: '2rem'}}>
        {isPending
          ? 'Your stall is in draft mode. Build your menu and apply to an event to get approved.'
          : 'Your stall is approved! Go live at your event.'}
      </p>

      {error && <div className="error-msg" style={{color: 'red', padding: '10px', background: '#fee', borderRadius: '5px', marginBottom: '1rem'}}>{error}</div>}
      {message && <div className="success-msg" style={{color: 'green', padding: '10px', background: '#efe', borderRadius: '5px', marginBottom: '1rem'}}>{message}</div>}

      {/* Info Card */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Your Stall</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{user?.name}</div>
            <div style={{ color: '#555', fontSize: '0.85rem' }}>/{user?.slug}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ padding: '0.25rem 0.5rem', background: isPending ? '#ffa' : '#cfc', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {user?.approvalStatus?.toUpperCase()}
            </span>
            {user?.isLive && <span style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', background: 'red', color: 'white', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>● LIVE</span>}
          </div>
        </div>
      </div>

      {/* Menu Builder */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>📋 Menu Builder</h3>
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input className="form-input" type="text" placeholder="Item Name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required style={{ flex: 2, padding: '0.5rem' }} />
          <input className="form-input" type="number" placeholder="Price (₹)" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} required style={{ flex: 1, padding: '0.5rem' }} />
          <input className="form-input" type="number" placeholder="Stock" value={newItemStock} onChange={(e) => setNewItemStock(e.target.value)} required style={{ flex: 1, padding: '0.5rem' }} />
          <button className="btn btn-primary" type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Add</button>
        </form>

        {inventory.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {inventory.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                <span><strong>{item.name}</strong> - ₹{item.price} (Stock: {item.stock})</span>
                <button onClick={() => handleDeleteItem(idx)} style={{ color: 'red', border: 'none', background: 'transparent', cursor: 'pointer' }}>🗑️</button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>No items yet. Add something to your menu!</p>
        )}
      </div>

      {/* Apply to Event */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>📩 Apply to an Event</h3>
        <form onSubmit={handleApply} style={{ display: 'flex', gap: '0.75rem' }}>
          <input className="form-input" type="text" placeholder="Enter event code (e.g. CEG26)" value={eventCode} onChange={(e) => setEventCode(e.target.value)} required style={{ flex: 1, padding: '0.5rem' }} />
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </form>
      </div>

      {/* Go Live (approved only) */}
      {!isPending && (
        <div className="card" style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>🟢 Go Live (Fest Day)</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input className="form-input" type="text" placeholder="Current event code" value={liveCode} onChange={(e) => setLiveCode(e.target.value)} style={{ flex: 1, padding: '0.5rem' }} disabled={user?.isLive} />
            <button className="btn" onClick={handleGoLive} disabled={liveLoading} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: user?.isLive ? 'red' : 'green', color: 'white' }}>
              {liveLoading ? '...' : user?.isLive ? 'Go Offline' : 'Go Live'}
            </button>
          </div>
        </div>
      )}

      {/* Storefront Link */}
      {!isPending && (
        <div className="card" style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>🖨️ Your Storefront URL & QR</h3>
          <p style={{ color: '#666', marginBottom: '1rem' }}>Customers can scan this QR code or visit the link to order.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid #eee', display: 'inline-block' }}>
              <QRCodeSVG value={`${window.location.origin}/store/${user?.slug}`} size={160} />
            </div>
            <code style={{ width: '100%', display: 'block', padding: '0.75rem 1rem', background: '#f5f5f5', borderRadius: '4px', wordBreak: 'break-all' }}>
              {window.location.origin}/store/{user?.slug}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
