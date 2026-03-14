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
    fetch(`http://${window.location.hostname}:5005/api/vendors/store/${slug}`)
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
        fetch(`http://${window.location.hostname}:5005/api/orders/${placedOrderId}`)
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
      const res = await fetch(`http://${window.location.hostname}:5005/api/orders`, {
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
      if (placedOrderStatus === 'Ready') return '#28a745';
      if (placedOrderStatus === 'Preparing') return '#ffc107';
      if (placedOrderStatus === 'Completed') return '#6c757d';
      return '#007bff';
    };

    const getStatusMessage = () => {
      if (placedOrderStatus === 'Ready') return 'Your order is ready for pickup! 🎉';
      if (placedOrderStatus === 'Preparing') return 'Your order is being prepared... 🔥';
      if (placedOrderStatus === 'Completed') return 'Order completed. Enjoy your meal! 🍔';
      return 'Waiting for the vendor to confirm your order... ⏳';
    };

    return (
      <div className="storefront-closed" style={{padding: '2rem', textAlign: 'center'}}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {placedOrderStatus === 'Ready' ? '🎉' : placedOrderStatus === 'Preparing' ? '🔥' : placedOrderStatus === 'Completed' ? '✅' : '⏳'}
        </div>
        <h1 style={{fontSize: '2rem', marginBottom: '1rem', color: getStatusColor()}}>
          {placedOrderStatus}
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
  // In the vendor schema, `stock` exists.
  return (
    <div style={{padding: '1rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif'}}>
      {/* Header */}
      <div className="storefront-header" style={{textAlign: 'center', marginBottom: '2rem'}}>
        <div className="storefront-name" style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{vendor.name}</div>
        <span style={{ padding: '0.2rem 0.5rem', background: 'red', color: 'white', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block', marginTop: '0.5rem' }}>● LIVE</span>
      </div>

      {error && (
        <div style={{ maxWidth: '900px', margin: '1rem auto' }}>
           <div className="error-msg" style={{color: 'red', padding: '10px', background: '#fee', borderRadius: '5px', textAlign: 'center'}}>{error}</div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="menu-grid" style={{ paddingBottom: cartCount > 0 ? '120px' : '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {vendor.inventory.map((item, idx) => (
          <div className="menu-item" key={idx} style={{background: 'white', border: '1px solid #eee', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
            <div>
              <div className="menu-item-name" style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{item.name}</div>
              {cart[item.name] && (
                <div style={{ fontSize: '0.8rem', color: '#0066cc', marginTop: '0.25rem', fontWeight: 'bold' }}>
                  {cart[item.name].quantity} in cart
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="menu-item-price" style={{fontWeight: 'bold', color: 'green'}}>₹{item.price}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {cart[item.name] && (
                  <button className="btn" onClick={() => removeFromCart(item.name)} style={{ padding: '0.4rem 0.7rem', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    −
                  </button>
                )}
                <button className="btn" onClick={() => addToCart(item)} style={{ padding: '0.4rem 0.7rem', background: '#e0f7fa', color: '#006064', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Bar */}
      {cartCount > 0 && !showCheckout && (
        <div style={{position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'white', borderTop: '1px solid #ddd', boxShadow: '0 -4px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center'}}>
          <div className="cart-summary" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '800px'}}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
              <span style={{ color: 'green', fontWeight: 800, marginLeft: '0.75rem', fontSize: '1.2rem' }}>
                ₹{cartTotalAmount}
              </span>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCheckout(true)} style={{padding: '0.8rem 1.5rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>
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
          <div className="card" style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '2rem', borderRadius: '12px' }}>
            <h2 style={{ fontWeight: 800, marginBottom: '0.25rem', fontSize: '1.5rem' }}>💳 Checkout</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {cartCount} item{cartCount !== 1 ? 's' : ''} · ₹{cartTotalAmount} total
            </p>

            {/* Items Summary */}
            <div style={{ marginBottom: '1.25rem', background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
              {cartItems.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.9rem' }}>
                  <span style={{fontWeight: 'bold'}}>{it.quantity}× {it.name}</span>
                  <span style={{ color: '#666' }}>₹{it.price * it.quantity}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0 0', borderTop: '1px solid #ddd', fontWeight: 800, fontSize: '1.1rem', marginTop: '0.5rem' }}>
                <span>Total</span>
                <span style={{ color: 'green' }}>₹{cartTotalAmount}</span>
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="form-group" style={{marginBottom: '1.5rem'}}>
              <label className="form-label" style={{display: 'block', fontWeight: 'bold', marginBottom: '0.5rem'}}>WhatsApp Number</label>
              <input
                className="form-input"
                type="tel"
                placeholder="91XXXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc'}}
              />
            </div>

            {/* UPI Pay Button */}
            <a
              href={upiString}
              className="btn btn-success btn-lg btn-block"
              style={{ display: 'block', width: '100%', padding: '1rem', background: '#28a745', color: 'white', textAlign: 'center', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', marginBottom: '1.5rem' }}
              onClick={(e) => {
                // On desktop, the deep-link won't work, so we just let the QR handle it
              }}
            >
              Pay ₹{cartTotalAmount} via UPI App
            </a>

            {/* Fallback QR */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.8rem', fontWeight: 'bold' }}>
                Or scan from another phone:
              </p>
              <div style={{ display: 'inline-block', padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #eee' }}>
                <QRCodeSVG value={upiString} size={180} />
              </div>
            </div>

            {/* Confirm Order */}
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={placeOrder}
              disabled={placing}
              style={{width: '100%', padding: '1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '0.5rem'}}
            >
              {placing ? 'Placing Order...' : '✓ I\'ve Paid — Place Order'}
            </button>

            <button
              className="btn btn-outline btn-block"
              style={{ width: '100%', padding: '1rem', background: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}
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
