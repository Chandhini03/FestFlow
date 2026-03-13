import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import apiFetch from '../api';

export default function Storefront() {
  const { slug } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cart state
  const [cart, setCart] = useState({});
  const [whatsapp, setWhatsapp] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    apiFetch(`/vendors/store/${slug}`)
      .then(setVendor)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = (item) => {
    setCart((prev) => ({
      ...prev,
      [item.name]: {
        ...item,
        quantity: (prev[item.name]?.quantity || 0) + 1,
      },
    }));
  };

  const removeFromCart = (itemName) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[itemName].quantity <= 1) {
        delete updated[itemName];
      } else {
        updated[itemName] = { ...updated[itemName], quantity: updated[itemName].quantity - 1 };
      }
      return updated;
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const cartCount = cartItems.reduce((sum, it) => sum + it.quantity, 0);

  // UPI intent string
  const upiString = vendor
    ? `upi://pay?pa=${encodeURIComponent(vendor.upiId)}&pn=${encodeURIComponent(vendor.stallName)}&am=${cartTotal}&cu=INR&tn=${encodeURIComponent(`Order at ${vendor.stallName}`)}`
    : '';

  const placeOrder = async () => {
    if (!whatsapp || whatsapp.length < 10) {
      setError('Please enter a valid WhatsApp number');
      return;
    }
    setPlacing(true);
    setError('');
    try {
      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          vendorSlug: slug,
          items: cartItems.map((it) => ({ name: it.name, price: it.price, quantity: it.quantity })),
          customerWhatsApp: whatsapp,
        }),
      });
      setOrderPlaced(true);
      setCart({});
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading storefront...</div>;

  if (error && !vendor) {
    return (
      <div className="storefront-closed">
        <h1>😕 Stall Not Found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    );
  }

  if (!vendor?.isLive) {
    return (
      <div className="storefront-closed">
        <h1>🔒 Stall Closed</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
          <strong>{vendor?.stallName}</strong> is currently offline. Check back during the next event!
        </p>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="storefront-closed">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h1>Order Placed!</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginTop: '0.5rem' }}>
          Your order at <strong>{vendor.stallName}</strong> has been submitted. You'll receive a WhatsApp message when it's confirmed and ready for pickup!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="storefront-header">
        <div className="storefront-name">{vendor.stallName}</div>
        <span className="badge badge-live" style={{ marginTop: '0.5rem' }}>● LIVE</span>
      </div>

      {error && (
        <div style={{ maxWidth: '900px', margin: '1rem auto', padding: '0 1.5rem' }}>
          <div className="error-msg">{error}</div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="menu-grid" style={{ paddingBottom: cartCount > 0 ? '120px' : '2rem' }}>
        {vendor.inventory.map((item, idx) => (
          <div className="menu-item" key={idx}>
            <div>
              <div className="menu-item-name">{item.name}</div>
              {cart[item.name] && (
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-light)', marginTop: '0.25rem' }}>
                  {cart[item.name].quantity} in cart
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="menu-item-price">₹{item.price}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {cart[item.name] && (
                  <button className="btn btn-outline btn-sm" onClick={() => removeFromCart(item.name)} style={{ padding: '0.3rem 0.6rem' }}>
                    −
                  </button>
                )}
                <button className="btn btn-primary btn-sm" onClick={() => addToCart(item)} style={{ padding: '0.3rem 0.6rem' }}>
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Bar */}
      {cartCount > 0 && !showCheckout && (
        <div className="cart-sticky">
          <div className="cart-summary">
            <div>
              <span style={{ fontWeight: 700 }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
              <span style={{ color: 'var(--success)', fontWeight: 800, marginLeft: '0.75rem', fontSize: '1.1rem' }}>
                ₹{cartTotal}
              </span>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCheckout(true)}>
              Checkout →
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontWeight: 800, marginBottom: '0.25rem' }}>💳 Checkout</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {cartCount} item{cartCount !== 1 ? 's' : ''} · ₹{cartTotal} total
            </p>

            {/* Items Summary */}
            <div style={{ marginBottom: '1.25rem' }}>
              {cartItems.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.9rem' }}>
                  <span>{it.quantity}× {it.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>₹{it.price * it.quantity}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0 0', borderTop: '1px solid var(--border)', fontWeight: 700, fontSize: '1.05rem' }}>
                <span>Total</span>
                <span style={{ color: 'var(--success)' }}>₹{cartTotal}</span>
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="form-group">
              <label className="form-label">WhatsApp Number</label>
              <input
                className="form-input"
                type="tel"
                placeholder="91XXXXXXXXXX"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>

            {/* UPI Pay Button */}
            <a
              href={upiString}
              className="btn btn-success btn-lg btn-block"
              style={{ textDecoration: 'none', marginBottom: '1rem' }}
              onClick={(e) => {
                // On desktop, the deep-link won't work, so we just let the QR handle it
              }}
            >
              Pay ₹{cartTotal} via UPI App
            </a>

            {/* Fallback QR */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Or scan from another phone:
              </p>
              <div style={{
                display: 'inline-block', padding: '1rem', background: '#fff', borderRadius: 'var(--radius-sm)',
              }}>
                <QRCodeSVG value={upiString} size={180} />
              </div>
            </div>

            {/* Confirm Order */}
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? 'Placing Order...' : '✓ I\'ve Paid — Place Order'}
            </button>

            <button
              className="btn btn-outline btn-block"
              style={{ marginTop: '0.5rem' }}
              onClick={() => setShowCheckout(false)}
            >
              ← Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
