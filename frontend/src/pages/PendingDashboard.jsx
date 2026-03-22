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
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemStock, setNewItemStock] = useState('');

  // Edit state
  const [editIndex, setEditIndex] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  const [liveCode, setLiveCode] = useState(user?.currentEventCode || '');
  const [liveLoading, setLiveLoading] = useState(false);

  // Staff Management State
  const [staffList, setStaffList] = useState([]);
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const isPending = user?.approvalStatus === 'pending';
  const token = localStorage.getItem('token');

  const refreshUser = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/vendors/me`, {
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

  const fetchStaff = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/vendors/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStaffList(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    refreshUser();
    if (!isPending) fetchStaff();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/applications`, {
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
      const res = await fetch(`http://${window.location.hostname}:5000/api/vendors/live`, {
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
      const res = await fetch(`http://${window.location.hostname}:5000/api/vendors/menu`, {
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
    if (!newItemName || !newItemPrice || !newItemStock) return;
    const newItem = {
      name: newItemName,
      description: newItemDesc,
      price: Number(newItemPrice),
      stock: Number(newItemStock),
    };
    const updatedInventory = [...inventory, newItem];
    setInventory(updatedInventory);
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('');
    setNewItemStock('');
    saveMenu(updatedInventory);
  };

  const handleDeleteItem = (index) => {
    const newInventory = inventory.filter((_, i) => i !== index);
    setInventory(newInventory);
    saveMenu(newInventory);
  };

  const startEdit = (index) => {
    const item = inventory[index];
    setEditIndex(index);
    setEditName(item.name);
    setEditDesc(item.description || '');
    setEditPrice(String(item.price));
    setEditStock(String(item.stock));
  };

  const cancelEdit = () => {
    setEditIndex(null);
  };

  const saveEdit = () => {
    if (!editName || !editPrice || !editStock) return;
    const updatedInventory = inventory.map((item, i) =>
      i === editIndex
        ? { ...item, name: editName, description: editDesc, price: Number(editPrice), stock: Number(editStock) }
        : item
    );
    setInventory(updatedInventory);
    setEditIndex(null);
    saveMenu(updatedInventory);
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/vendors/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: staffUsername, password: staffPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      setStaffUsername('');
      setStaffPassword('');
      fetchStaff();
    } catch (err) {
      setError(err.message);
    }
  };

  // Build QR code URL
  const ipHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '192.168.243.129' 
    : window.location.hostname;
  const qrUrl = user?.slug ? `http://${ipHost}:5173/store/${user.slug}` : '';

  return (
    <div className="page" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 className="page-title" style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--cherry-cola)', textAlign: 'center', marginBottom: '0.5rem' }}>
        {isPending ? '⏳ Stall Setup' : `🏪 ${user?.name}`}
      </h1>
      <p className="page-subtitle" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>
        {isPending
          ? 'Build your menu and apply to an event to get approved.'
          : 'Your stall is approved! Manage your menu and go live.'}
      </p>

      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        {/* Left Column: Menu Builder */}
        <div className="card" style={{ border: '2px solid var(--cherry-cola)', background: 'white' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: '900', color: 'var(--cherry-cola)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📋 Menu Builder
          </h3>
          <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <input className="form-input" type="text" placeholder="Item Name (e.g. Classic Burger)" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required />
            <input className="form-input" type="text" placeholder="Description (optional)" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input className="form-input" type="number" placeholder="Price (₹)" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} required style={{ flex: 1 }} />
              <input className="form-input" type="number" placeholder="Initial Stock" value={newItemStock} onChange={(e) => setNewItemStock(e.target.value)} required style={{ flex: 1 }} />
            </div>
            <button className="btn btn-primary" type="submit" style={{ padding: '1rem', borderRadius: '50px' }}>Add to Menu</button>
          </form>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {inventory.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {inventory.map((item, idx) => (
                  <li key={idx} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: item.stock <= 5 ? 'var(--danger-bg)' : 'transparent' }}>
                    {editIndex === idx ? (
                      /* Inline Edit Mode */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input className="form-input" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" style={{ fontSize: '0.9rem' }} />
                        <input className="form-input" type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" style={{ fontSize: '0.85rem' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input className="form-input" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="Price" style={{ flex: 1, fontSize: '0.9rem' }} />
                          <input className="form-input" type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)} placeholder="Stock" style={{ flex: 1, fontSize: '0.9rem' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={saveEdit} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}>Save</button>
                          <button onClick={cancelEdit} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '800', color: 'var(--cherry-dark)' }}>{item.name}</div>
                          {item.description && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.description}</div>
                          )}
                          <div style={{ fontSize: '0.85rem', color: 'var(--cherry-cola)', fontWeight: '700', marginTop: '0.25rem' }}>
                            ₹{item.price} · <span style={{ color: item.stock === 0 ? 'red' : 'inherit' }}>{item.stock} in stock</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => startEdit(idx)} style={{ color: 'var(--cherry-cola)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem' }} title="Edit">✏️</button>
                          <button onClick={() => handleDeleteItem(idx)} style={{ color: 'var(--cherry-cola)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem' }} title="Delete">🗑️</button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Your menu is empty.</p>
            )}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Apply Card */}
          <div className="card" style={{ background: 'var(--cherry-cola)', color: 'white', border: 'none' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: '900' }}>📩 Event Application</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', opacity: 0.9 }}>Enter the event code provided by the organizers.</p>
            <form onSubmit={handleApply} style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="form-input" type="text" placeholder="CEG26" value={eventCode} onChange={(e) => setEventCode(e.target.value)} required style={{ border: 'none', borderRadius: '50px' }} />
              <button className="btn" type="submit" disabled={loading} style={{ background: 'white', color: 'var(--cherry-cola)', borderRadius: '50px', fontWeight: '900' }}>
                {loading ? '...' : 'Apply'}
              </button>
            </form>
          </div>

          {/* Go Live Card */}
          {!isPending && (
            <div className="card" style={{ border: '2px solid var(--cherry-cola)', background: 'white' }}>
              <h3 style={{ marginBottom: '1rem', fontWeight: '900', color: 'var(--cherry-cola)' }}>🟢 Go Live</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Toggle your stall availability for the current event.</p>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input className="form-input" type="text" placeholder="Event Code" value={liveCode} onChange={(e) => setLiveCode(e.target.value)} style={{ flex: 1 }} disabled={user?.isLive} />
                <button className="btn" onClick={handleGoLive} disabled={liveLoading} style={{ 
                  flex: 1, padding: '1rem', borderRadius: '50px',
                  background: user?.isLive ? 'var(--cherry-cola)' : 'green', 
                  color: 'white', fontWeight: '900' 
                }}>
                  {liveLoading ? '...' : user?.isLive ? 'Go Offline' : 'Go Live'}
                </button>
              </div>
            </div>
          )}

          {/* Staff Management Card */}
          {!isPending && (
            <div className="card" style={{ border: '2px solid var(--cherry-cola)', background: 'white' }}>
              <h3 style={{ marginBottom: '1.5rem', fontWeight: '900', color: 'var(--cherry-cola)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                👥 Staff Management
              </h3>
              <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <input className="form-input" type="text" placeholder="Cashier Username" value={staffUsername} onChange={(e) => setStaffUsername(e.target.value)} required />
                <input className="form-input" type="password" placeholder="Password" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required />
                <button className="btn btn-primary" type="submit" style={{ borderRadius: '50px' }}>Add Cashier</button>
              </form>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {staffList.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: '700' }}>{s.username}</span>
                    <span className="badge badge-approved" style={{ fontSize: '0.6rem' }}>Cashier</span>
                  </div>
                ))}
                {staffList.length === 0 && <p style={{ textAlign: 'center', color: '#999', fontSize: '0.8rem' }}>No staff added yet</p>}
              </div>
            </div>
          )}

          {/* QR Code Card */}
          {user?.isLive && (
            <div className="card" style={{ textAlign: 'center', background: 'rgba(154, 0, 2, 0.05)', border: '1px dashed var(--cherry-cola)' }}>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: '900', color: 'var(--cherry-cola)' }}>🖨️ Stall QR Code</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Print this for your customers to scan.</p>
              <div style={{ padding: '1rem', background: 'white', borderRadius: '16px', display: 'inline-block', border: '4px solid var(--cherry-cola)' }}>
                <QRCodeSVG value={qrUrl} size={160} />
              </div>
              <code style={{ width: '100%', display: 'block', marginTop: '1rem', padding: '0.75rem', background: 'white', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--cherry-cola)', fontWeight: 'bold' }}>
                /{user?.slug}
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
