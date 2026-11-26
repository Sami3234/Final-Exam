import React, { useState, useEffect } from 'react';
import { request } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await request('/orders');
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    setError('');
    setActionMessage('');
    setCancellingId(orderId);
    try {
      const res = await request(`/orders/${orderId}/cancel`, {
        method: 'POST'
      });
      setActionMessage(res.message);
      await fetchOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <div className="loading-state">Loading your orders...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Order History</h2>
        <p className="text-muted">Review placed orders and manage cancellations</p>
      </div>

      {actionMessage && <div className="alert-success">{actionMessage}</div>}
      {error && <div className="alert-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="empty-state">No orders placed yet.</div>
      ) : (
        <div className="orders-list">
          {orders.map((o) => (
            <div key={o._id} className="order-card">
              <div className="order-header">
                <div>
                  <span className="order-id">Order #{o._id}</span>
                  <div className="order-date">{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="order-header-right">
                  <span className={`status-badge status-${o.status}`}>{o.status.toUpperCase()}</span>
                  {o.status === 'placed' && (
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={cancellingId === o._id}
                      onClick={() => handleCancelOrder(o._id)}
                    >
                      {cancellingId === o._id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>

              <div className="order-items">
                <table className="order-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.name}</td>
                        <td>{it.quantity}</td>
                        <td>{it.price} PKR</td>
                        <td>{it.price * it.quantity} PKR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="order-footer">
                <div>Items Subtotal: <strong>{o.subtotal} PKR</strong></div>
                <div>Shipping: <strong>{o.shipping} PKR</strong></div>
                <div>Grand Total: <strong className="order-total">{o.total} PKR</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
