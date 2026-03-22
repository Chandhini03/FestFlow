import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function Storefront() {
  const { slug } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cart state
  const [cart, setCart] = useState({});
  const [phone, setPhone] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const [placedOrderStatus, setPlacedOrderStatus] = useState('');
  const [placing, setPlacing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    fetch(`/api/vendors/store/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setVendor(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  // Live Tracking Poller
  useEffect(() => {
    let intervalId;
    if (placedOrderId && placedOrderStatus !== 'Completed') {
      intervalId = setInterval(() => {
        fetch(`/api/orders/${placedOrderId}`)
          .then(res => res.json())
          .then(data => {
            if (data.status) {
              setPlacedOrderStatus(data.status);
            }
          })
          .catch(err => console.error("Tracking Error:", err));
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [placedOrderId, placedOrderStatus]);

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
  const cartTotalAmount = cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const cartCount = cartItems.reduce((sum, it) => sum + it.quantity, 0);

  // UPI intent string
  const upiString = vendor
    ? `upi://pay?pa=${encodeURIComponent(vendor.upiId)}&pn=${encodeURIComponent(vendor.name)}&am=${cartTotalAmount}&cu=INR&tn=${encodeURIComponent(`Order at ${vendor.name}`)}`
    : '';

  const placeOrder = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid Phone number');
      return;
    }
    setPlacing(true);
    setError('');
    try {
      const res = await fetch(`/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorSlug: slug,
          items: cartItems.map((it) => ({ name: it.name, price: it.price, quantity: it.quantity })),
          customerPhone: phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setOrderPlaced(true);
      setPlacedOrderId(data.order._id);
      setPlacedOrderStatus(data.order.status);
      
      // Save order to global tracking array
      const currentOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
      currentOrders.push({
        id: data.order._id,
        vendorName: vendor.name,
        totalAmount: data.order.totalAmount,
        items: data.order.items.map(i => ({ name: i.name, quantity: i.quantity }))
      });
      localStorage.setItem('customerOrders', JSON.stringify(currentOrders));
      // Notify the global CustomerOrders component
      window.dispatchEvent(new Event('orderPlaced'));
      
      setCart({});
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="loading-screen" style={{padding: '2rem', textAlign: 'center'}}>Loading storefront...</div>;

  if (error && !vendor) {
    return (
      <div className="storefront-closed" style={{padding: '2rem', textAlign: 'center'}}>
        <h1 style={{fontSize: '2rem', marginBottom: '1rem'}}>😕 Stall Not Found</h1>
        <p style={{ color: '#888' }}>{error}</p>
      </div>
    );
  }

  if (!vendor?.isLive) {
    return (
      <div className="storefront-closed" style={{padding: '2rem', textAlign: 'center'}}>
        <h1 style={{fontSize: '2rem', marginBottom: '1rem'}}>🔒 Stall Closed</h1>
        <p style={{ color: '#888', maxWidth: '400px', margin: '0 auto' }}>
          <strong>{vendor?.name}</strong> is currently offline. Check back during the next event!
        </p>
      </div>
    );
  }

  if (orderPlaced) {
    const getStatusColor = () => {
      if (placedOrderStatus === 'Confirmed') return '#28a745';
      if (placedOrderStatus === 'Ready') return '#28a745';
      if (placedOrderStatus === 'Preparing') return '#ffc107';
      if (placedOrderStatus === 'Completed') return '#6c757d';
      return '#007bff';
    };

    const getStatusEmoji = () => {
      if (placedOrderStatus === 'Confirmed') return '✅';
      if (placedOrderStatus === 'Ready') return '🎉';
      if (placedOrderStatus === 'Preparing') return '🔥';
      if (placedOrderStatus === 'Completed') return '✅';
      return '⏳';
    };

    const getStatusMessage = () => {
      if (placedOrderStatus === 'Confirmed') return 'Payment Verified and Order Confirmed! 🎉';
      if (placedOrderStatus === 'Ready') return 'Your order is ready for pickup! 🎉';
      if (placedOrderStatus === 'Preparing') return 'Your order is Under Preparation... 🔥';
      if (placedOrderStatus === 'Completed') return 'Order completed. Enjoy your meal! 🍔';
      return 'Waiting for the vendor to verify your payment... ⏳';
    };

    return (
      <div className="storefront-closed" style={{padding: '2rem', textAlign: 'center'}}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {getStatusEmoji()}
        </div>
        <h1 style={{fontSize: '2rem', marginBottom: '1rem', color: getStatusColor()}}>
          {placedOrderStatus === 'Confirmed' ? 'Payment Verified' : (placedOrderStatus === 'Preparing' ? 'Under Preparation' : placedOrderStatus)}
        </h1>
        <p style={{ color: '#666', maxWidth: '420px', margin: '0.5rem auto 1.5rem', lineHeight: 1.5, fontSize: '1.1rem' }}>
          {getStatusMessage()}
        </p>
        
        {placedOrderStatus !== 'Completed' && (
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd', display: 'inline-block' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>
              Order ID: <strong style={{ color: '#333' }}>#{placedOrderId?.slice(-6).toUpperCase()}</strong>
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#aaa' }}>
              This page automatically updates in real-time.
            </p>
          </div>
        )}
        
        {placedOrderStatus === 'Completed' && (
          <button 
            className="btn btn-outline" 
            style={{ padding: '0.8rem 1.5rem', marginTop: '1rem', cursor: 'pointer', borderRadius: '8px' }}
            onClick={() => {
              setOrderPlaced(false);
              setPlacedOrderId(null);
            }}
          >
            Place Another Order
          </button>
        )}
      </div>
    );
  }

  // Filter out items without stock if required by frontend logic, or display everything
  return (
    <div className="page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="storefront-header" style={{ textAlign: 'center', marginBottom: '2rem', background: 'transparent', border: 'none' }}>
        <div className="storefront-name" style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--cherry-cola)' }}>{vendor.name}</div>
        <div style={{ marginTop: '0.5rem' }}>
          <span className="badge badge-live" style={{ background: 'var(--cherry-cola)', color: 'white', border: 'none' }}>● LIVE</span>
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: '400px', margin: '1rem auto' }}>
           <div className="error-msg">{error}</div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="menu-grid" style={{ paddingBottom: cartCount > 0 ? '120px' : '2rem' }}>
        {vendor.inventory.map((item, idx) => {
          const inCart = cart[item.name]?.quantity || 0;
          const isOutOfStock = item.stock <= 0;
          const isMaxed = inCart >= item.stock;

          return (
            <div className="menu-item" key={idx} style={{ 
              opacity: isOutOfStock ? 0.6 : 1,
              border: inCart > 0 ? '2px solid var(--cherry-cola)' : '1px solid var(--border)',
              background: 'white'
            }}>
              <div style={{ flex: 1 }}>
                <div className="menu-item-name" style={{ color: 'var(--cherry-dark)' }}>{item.name}</div>
                {item.description && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{item.description}</div>
                )}
                <div style={{ fontSize: '0.8rem', color: isOutOfStock ? 'var(--cherry-cola)' : 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 'bold' }}>
                  {isOutOfStock ? 'SOLD OUT' : `${item.stock} available`}
                </div>
                {inCart > 0 && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--cherry-cola)', marginTop: '0.4rem', fontWeight: '800' }}>
                    {inCart} in cart
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="menu-item-price" style={{ color: 'var(--cherry-cola)', fontSize: '1.25rem' }}>₹{item.price}</span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {inCart > 0 && (
                    <button className="btn btn-outline btn-sm" onClick={() => removeFromCart(item.name)} style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}>
                      −
                    </button>
                  )}
                  {!isOutOfStock && (
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => addToCart(item)} 
                      disabled={isMaxed}
                      style={{ 
                        width: '32px', height: '32px', padding: 0, borderRadius: '50%',
                        backgroundColor: isMaxed ? '#ccc' : 'var(--cherry-cola)',
                        cursor: isMaxed ? 'not-allowed' : 'pointer'
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Bar */}
      {cartCount > 0 && !showCheckout && (
        <div className="cart-sticky" style={{ background: 'var(--cherry-cola)', color: 'white', borderTop: 'none' }}>
          <div className="cart-summary">
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
              <span style={{ marginLeft: '1rem', fontSize: '1.4rem', fontWeight: '900', color: 'var(--cream-vanilla)' }}>
                ₹{cartTotalAmount}
              </span>
            </div>
            <button className="btn" onClick={() => setShowCheckout(true)} style={{ background: 'white', color: 'var(--cherry-cola)', padding: '0.8rem 2rem', borderRadius: '50px', fontWeight: '900', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              Order Now →
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(74, 0, 1, 0.85)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--cream-vanilla)', padding: '2.5rem 2rem', border: 'none' }}>
            <h2 style={{ fontWeight: 900, marginBottom: '0.5rem', fontSize: '1.75rem', color: 'var(--cherry-cola)', textAlign: 'center' }}>💳 Checkout</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '600' }}>
              {cartCount} items · Total ₹{cartTotalAmount}
            </p>

            {error && <div className="error-msg" style={{ textAlign: 'center' }}>{error}</div>}

            {/* Items Summary */}
            <div style={{ marginBottom: '1.5rem', background: 'rgba(154, 0, 2, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px dashed var(--cherry-cola)' }}>
              {cartItems.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '1rem' }}>
                  <span style={{ fontWeight: '700', color: 'var(--cherry-dark)' }}>{it.quantity}× {it.name}</span>
                  <span style={{ color: 'var(--cherry-cola)', fontWeight: '800' }}>₹{it.price * it.quantity}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0', borderTop: '2px solid var(--cherry-cola)', fontWeight: '900', fontSize: '1.25rem', marginTop: '1rem', color: 'var(--cherry-cola)' }}>
                <span>Total</span>
                <span>₹{cartTotalAmount}</span>
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">WhatsApp Number</label>
              <input
                className="form-input"
                type="tel"
                placeholder="91XXXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Step 1: Place Order */}
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={placeOrder}
              disabled={placing}
              style={{ padding: '1.25rem', fontSize: '1.1rem', borderRadius: '50px' }}
            >
              {placing ? 'Placing Order...' : '🛒 Place Order'}
            </button>

            {/* Payment Instructions */}
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(154, 0, 2, 0.05)', borderRadius: '12px', border: '1px solid var(--cherry-cola)' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--cherry-cola)', margin: '0 0 0.5rem' }}>💡 Payment Instructions</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                1. Scan the UPI QR code below to pay<br/>
                2. Complete payment in your UPI app<br/>
                3. Click "Place Order" above to submit your order<br/>
                4. The vendor will verify your payment
              </p>
            </div>

            <button
              className="btn btn-outline btn-block"
              style={{ marginTop: '0.75rem', border: 'none' }}
              onClick={() => setShowCheckout(false)}
            >
              ← Back to Menu
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Scan to pay via UPI:
              </p>
              <div style={{ display: 'inline-block', padding: '10px', background: 'white', borderRadius: '12px', border: '4px solid var(--cherry-cola)' }}>
                <QRCodeSVG value={upiString} size={150} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
