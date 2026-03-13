import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../api';

export default function WaitingRoom() {
  const { user, refreshUser } = useAuth();
  const [eventCode, setEventCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Go Live state (for approved vendors)
  const [liveCode, setLiveCode] = useState(user?.currentEventCode || '');
  const [liveLoading, setLiveLoading] = useState(false);

  const isPending = user?.approvalStatus === 'pending';

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await apiFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({ eventCode }),
      });
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
      const data = await apiFetch('/vendors/live', {
        method: 'PUT',
        body: JSON.stringify({ eventCode: liveCode, goLive: !user.isLive }),
      });
      setMessage(data.message);
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">
        {isPending ? '⏳ Waiting Room' : `🏪 ${user?.stallName}`}
      </h1>
      <p className="page-subtitle">
        {isPending
          ? 'Your stall is in draft mode. Build your menu and apply to an event to get approved.'
          : 'Your stall is approved! Go live at your event.'}
      </p>

      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      {/* Stall info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              Your Stall
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user?.stallName}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              /{user?.slug}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${isPending ? 'badge-pending' : 'badge-approved'}`}>
              {user?.approvalStatus}
            </span>
            {user?.isLive && (
              <span className="badge badge-live" style={{ marginLeft: '0.5rem' }}>● LIVE</span>
            )}
          </div>
        </div>
      </div>

      {/* Apply to Event */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1rem' }}>
          📋 Apply to an Event
        </h3>
        <form onSubmit={handleApply} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="form-input"
            type="text"
            placeholder="Enter event code (e.g. CEG26)"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </form>
      </div>

      {/* Go Live (approved vendors only) */}
      {!isPending && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1rem' }}>
            🟢 Go Live
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              className="form-input"
              type="text"
              placeholder="Current event code"
              value={liveCode}
              onChange={(e) => setLiveCode(e.target.value)}
              style={{ flex: 1 }}
              disabled={user?.isLive}
            />
            <button
              className={`btn ${user?.isLive ? 'btn-danger' : 'btn-success'}`}
              onClick={handleGoLive}
              disabled={liveLoading}
            >
              {liveLoading ? '...' : user?.isLive ? 'Go Offline' : 'Go Live'}
            </button>
          </div>
        </div>
      )}

      {/* QR code hint for approved vendors */}
      {!isPending && (
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '1rem' }}>
            🖨️ Your Permanent QR Code
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Share this link for your storefront:
          </p>
          <code style={{
            display: 'block',
            padding: '0.75rem 1rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            color: 'var(--accent-light)',
            wordBreak: 'break-all'
          }}>
            {window.location.origin}/store/{user?.slug}
          </code>
        </div>
      )}
    </div>
  );
}
