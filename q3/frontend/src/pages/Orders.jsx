import React, { useState, useEffect } from 'react';
import { request } from '../api';

export default function Orders() {
  const [ordersList, setOrdersList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [activeCancelId, setActiveCancelId] = useState(null);

  const retrieveOrders = async () => {
    try {
      setLoadingOrders(true);
      const records = await request('/orders');
      setOrdersList(records);
    } catch (err) {
      setErrorBanner(err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    retrieveOrders();
  }, []);

  const handleCancelClick = async (orderId) => {
    setErrorBanner('');
    setSuccessBanner('');
    setActiveCancelId(orderId);
    try {
      const resp = await request(`/orders/${orderId}/cancel`, {
        method: 'POST'
      });
      setSuccessBanner(resp.message);
      await retrieveOrders();
    } catch (err) {
      setErrorBanner(err.message);
    } finally {
      setActiveCancelId(null);
    }
  };

  if (loadingOrders) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Retrieving your order records...</div>;

  return (
    <div className="main-wrapper">
      <div className="headline-wrap">
        <h2>Purchases & Orders</h2>
        <p className="text-subtle">Review placed orders and manage safe cancellations with single stock restoration</p>
      </div>

      {successBanner && <div className="banner-success">{successBanner}</div>}
      {errorBanner && <div className="banner-failure">{errorBanner}</div>}

      {ordersList.length === 0 ? (
        <div className="box-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No purchase history recorded.</div>
      ) : (
        <div>
          {ordersList.map((ord) => (
            <div key={ord._id} className="order-box">
              <div className="order-head">
                <div>
                  <span className="serial-tag">Invoice #{ord._id}</span>
                  <div className="date-sub">{new Date(ord.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`state-pill state-${ord.status}`}>{ord.status.toUpperCase()}</span>
                  {ord.status === 'placed' && (
                    <button
                      className="action-btn btn-crimson"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.82rem' }}
                      disabled={activeCancelId === ord._id}
                      onClick={() => handleCancelClick(ord._id)}
                    >
                      {activeCancelId === ord._id ? 'Processing...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Rate</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ord.items.map((line, idx) => (
                      <tr key={idx}>
                        <td>{line.name}</td>
                        <td>{line.quantity}</td>
                        <td>{line.price} PKR</td>
                        <td>{line.price * line.quantity} PKR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="order-bottom">
                <div>Subtotal: <strong>{ord.subtotal} PKR</strong></div>
                <div>Shipping Fee: <strong>{ord.shipping} PKR</strong></div>
                <div>Total Paid: <strong className="final-amount">{ord.total} PKR</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
