import React, { useState, useEffect, useRef } from 'react';
import { request } from '../api';

export default function Cart({ onCheckoutSuccess }) {
  const [cartState, setCartState] = useState({ items: [], subtotal: 0, shipping: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [inFlight, setInFlight] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [bannerSuccess, setBannerSuccess] = useState('');

  const idempotencyRef = useRef('key-' + Math.random().toString(36).substring(2) + '-' + Date.now());

  const loadCartData = async () => {
    try {
      setIsLoading(true);
      const data = await request('/cart');
      setCartState(data);
    } catch (err) {
      setBannerError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCartData();
  }, []);

  const changeQuantity = async (productId, nextQuantity) => {
    if (nextQuantity < 1) return;
    setBannerError('');
    try {
      const data = await request(`/cart/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: nextQuantity })
      });
      setCartState(data);
    } catch (err) {
      setBannerError(err.message);
    }
  };

  const removeRow = async (productId) => {
    setBannerError('');
    try {
      const data = await request(`/cart/${productId}`, {
        method: 'DELETE'
      });
      setCartState(data);
    } catch (err) {
      setBannerError(err.message);
    }
  };

  const executeCheckout = async () => {
    setBannerError('');
    setBannerSuccess('');
    setInFlight(true);

    try {
      const outcome = await request('/checkout', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyRef.current
        }
      });

      setBannerSuccess(`Order #${outcome.order._id} confirmed! Final Total: ${outcome.order.total} PKR`);
      idempotencyRef.current = 'key-' + Math.random().toString(36).substring(2) + '-' + Date.now();
      await loadCartData();

      if (onCheckoutSuccess) {
        setTimeout(onCheckoutSuccess, 1800);
      }
    } catch (err) {
      setBannerError(err.message);
    } finally {
      setInFlight(false);
    }
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Fetching cart snapshot...</div>;

  return (
    <div className="main-wrapper">
      <div className="headline-wrap">
        <h2>Your Shopping Bag</h2>
        <p className="text-subtle">Server-computed ledger, atomic inventory reservations, and idempotency lock</p>
      </div>

      {bannerError && <div className="banner-failure">{bannerError}</div>}
      {bannerSuccess && <div className="banner-success">{bannerSuccess}</div>}

      {cartState.items.length === 0 ? (
        <div className="box-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Your shopping bag is currently empty.
        </div>
      ) : (
        <div className="cart-split">
          <div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Title</th>
                  <th>Unit Rate</th>
                  <th>Units</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cartState.items.map((row) => (
                  <tr key={row.product._id}>
                    <td>
                      <strong>{row.product.name}</strong>
                      <div className="text-subtle" style={{ fontSize: '0.75rem' }}>Stock cap: {row.product.stock}</div>
                    </td>
                    <td>{row.product.price} PKR</td>
                    <td>
                      <div className="qty-stepper">
                        <button
                          className="btn-mini"
                          disabled={row.quantity <= 1}
                          onClick={() => changeQuantity(row.product._id, row.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="stepper-count">{row.quantity}</span>
                        <button
                          className="btn-mini"
                          disabled={row.quantity >= row.product.stock}
                          onClick={() => changeQuantity(row.product._id, row.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{row.itemTotal} PKR</td>
                    <td>
                      <button className="btn-clear" onClick={() => removeRow(row.product._id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoice-card">
            <h3>Invoice Breakdown</h3>
            <div className="custom-rule-box">
              <strong>Personal Rules ($N = 671$):</strong>
              <div>Flat Shipping Fee: <strong>50 + 671 = 721 PKR</strong></div>
              <div>Free Delivery Threshold: <strong>1000 + 671 = 1671 PKR</strong></div>
            </div>

            <div className="ledger-row">
              <span>Items Subtotal:</span>
              <span>{cartState.subtotal} PKR</span>
            </div>
            <div className="ledger-row">
              <span>Freight Fee:</span>
              <span>
                {cartState.shipping === 0 ? (
                  <span className="free-indicator">FREE (Subtotal &ge; 1671)</span>
                ) : (
                  `${cartState.shipping} PKR`
                )}
              </span>
            </div>
            <hr style={{ borderColor: '#e2e8f0', margin: '0.8rem 0' }} />
            <div className="ledger-row grand-row">
              <span>Final Payable:</span>
              <span>{cartState.total} PKR</span>
            </div>

            <div className="key-fingerprint">
              <span style={{ display: 'block', color: '#64748b' }}>Active Idempotency Fingerprint:</span>
              <code>{idempotencyRef.current}</code>
            </div>

            <button
              className="action-btn btn-teal full-width"
              style={{ padding: '0.75rem' }}
              disabled={inFlight || cartState.items.length === 0}
              onClick={executeCheckout}
            >
              {inFlight ? 'Securing Inventory...' : 'Safe Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
