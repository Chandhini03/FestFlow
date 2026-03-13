import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../api';

export default function MenuBuilder() {
  const { user, refreshUser } = useAuth();
  const [inventory, setInventory] = useState(user?.inventory || []);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.inventory) setInventory(user.inventory);
  }, [user]);

  const addItem = () => {
    if (!newName.trim() || !newPrice) return;
    setInventory([...inventory, { name: newName.trim(), price: Number(newPrice), available: true }]);
    setNewName('');
    setNewPrice('');
  };

  const removeItem = (idx) => {
    setInventory(inventory.filter((_, i) => i !== idx));
  };

  const toggleAvailable = (idx) => {
    setInventory(
      inventory.map((item, i) =>
        i === idx ? { ...item, available: !item.available } : item
      )
    );
  };

  const saveMenu = async () => {
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await apiFetch('/vendors/menu', {
        method: 'PUT',
        body: JSON.stringify({ inventory }),
      });
      setMessage('Menu saved! ✅');
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">🍽️ Menu Builder</h1>
      <p className="page-subtitle">Add, edit, or remove items from your stall menu</p>

      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      {/* Add item */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1rem' }}>Add New Item</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            type="text"
            placeholder="Item name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: 2, minWidth: '180px' }}
          />
          <input
            className="form-input"
            type="number"
            placeholder="Price (₹)"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            style={{ flex: 1, minWidth: '100px' }}
          />
          <button className="btn btn-primary" onClick={addItem}>
            + Add
          </button>
        </div>
      </div>

      {/* Current menu */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1rem' }}>
          Your Menu ({inventory.length} items)
        </h3>
        {inventory.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No items yet. Add your first item above!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {inventory.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  opacity: item.available ? 1 : 0.5,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: 'var(--success)', marginLeft: '0.75rem', fontWeight: 700 }}>
                    ₹{item.price}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleAvailable(idx)}
                  >
                    {item.available ? 'Available' : 'Unavailable'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="btn btn-success btn-lg btn-block"
        onClick={saveMenu}
        disabled={saving}
      >
        {saving ? 'Saving...' : '💾 Save Menu'}
      </button>
    </div>
  );
}
