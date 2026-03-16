import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CashierPOS() {
  const [vendor, setVendor] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!token || user?.role !== 'staff') {
      navigate('/signup?mode=staff');
      return;
    }

    // Fetch vendor inventory
    fetch(`http://${window.location.hostname}:5000/api/vendors/${user.vendor.id}`)
      .then(res => res.json())
      .then(data => {
        setVendor(data);
        setItems(data.inventory);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const addToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item.name]: {
        ...item,
        quantity: (prev[item.name]?.quantity || 0) + 1
      }
    }));
  };

  const removeFromCart = (itemName) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemName].quantity > 1) {
        newCart[itemName].quantity -= 1;
      } else {
        delete newCart[itemName];
      }
      return newCart;
    });
  };

  const total = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleLoggedCash = async () => {
    if (Object.keys(cart).length === 0) return;
    if (!phone) {
      setMessage({ type: 'error', text: 'Customer phone required for records' });
      return;
    }

    setProcessing(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/orders/cash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: Object.values(cart),
          totalAmount: total,
          customerPhone: phone
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: 'Cash Payment Logged Successfully!' });
      setCart({});
      setPhone('');
      
      // Refresh inventory
      const vRes = await fetch(`http://${window.location.hostname}:5000/api/vendors/${user.vendor.id}`);
      const vData = await vRes.json();
      setItems(vData.inventory);

    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading Stall...</div>;

  return (
    <div className="page-wide" style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ color: 'var(--cherry-cola)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             💵 Cashier POS
          </h1>
          <p className="page-subtitle">{vendor?.name} · {user.username}</p>
        </div>
        <button className="btn btn-outline" onClick={() => { localStorage.clear(); navigate('/signup'); }}>Logout</button>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error-msg' : 'success-msg'} style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Menu Section */}
        <div className="card" style={{ border: '2px solid var(--cherry-cola)' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--cherry-dark)', fontSize: '1.25rem' }}>Menu Items</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {items.map((item, i) => (
              <button
                key={i}
                disabled={item.stock === 0}
                onClick={() => addToCart(item)}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: item.stock === 0 ? '1px dashed #ccc' : '2px solid var(--border)',
                  background: item.stock === 0 ? '#f5f5f5' : 'white',
                  cursor: item.stock === 0 ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{item.name}</div>
                <div style={{ color: 'var(--success)', fontWeight: '700' }}>₹{item.price}</div>
                <div style={{ fontSize: '0.8rem', color: item.stock < 10 ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {item.stock} left
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart/Checkout Section */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '2px solid var(--cherry-cola)', alignSelf: 'start', position: 'sticky', top: '20px' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--cherry-cola)', fontWeight: '900' }}>Manual Entry</h2>
          
          <div className="form-group">
            <label className="form-label">Phone Number (Required)</label>
            <input 
              className="form-input" 
              type="tel" 
              placeholder="9876543210" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.values(cart).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.75rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: '700' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem' }}>₹{item.price} × {item.quantity}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <button onClick={() => removeFromCart(item.name)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--cream-vanilla)' }}>-</button>
                   <button onClick={() => addToCart(item)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--cream-vanilla)' }}>+</button>
                </div>
              </div>
            ))}
            {Object.keys(cart).length === 0 && (
              <div style={{ textAlign: 'center', py: '2rem' , color: '#999', fontSize: '0.9rem'}}>Select items to start</div>
            )}
          </div>

          <div style={{ borderTop: '2px solid var(--cherry-cola)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '400', fontSize: '1rem' }}>Total Amount</span>
            <span style={{ fontWeight: '900', fontSize: '1.5rem', color: 'var(--cherry-cola)' }}>₹{total}</span>
          </div>

          <button 
            className="btn btn-primary btn-block btn-lg" 
            style={{ marginTop: '1.5rem', borderRadius: '12px' }}
            disabled={processing || Object.keys(cart).length === 0}
            onClick={handleLoggedCash}
          >
            {processing ? 'Logging...' : 'LOG CASH PAYMENT'}
          </button>
        </div>
      </div>
    </div>
  );
}
