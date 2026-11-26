import React, { useState, useEffect, useRef } from 'react';
import { request } from '../api';

export default function Cart({ onCheckoutSuccess }) {
  const [cartData, setCartData] = useState({ items: [], subtotal: 0, shipping: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const idempotencyKeyRef = useRef('key-' + Math.random().toString(36).substring(2) + '-' + Date.now());

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await request('/cart');
      setCartData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQty = async (productId, newQty) => {
    if (newQty < 1) return;
    setError('');
    try {
      const data = await request(`/cart/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQty })
      });
      setCartData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (productId) => {
    setError('');
    try {
      const data = await request(`/cart/${productId}`, {
        method: 'DELETE'
      });
      setCartData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCheckout = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const result = await request('/checkout', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKeyRef.current
        }
      });

      setSuccess(`Order #${result.order._id} created successfully! Total: ${result.order.total} PKR`);
      idempotencyKeyRef.current = 'key-' + Math.random().toString(36).substring(2) + '-' + Date.now();
      await fetchCart();

      if (onCheckoutSuccess) {
        setTimeout(onCheckoutSuccess, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-state">Loading your cart...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Your Shopping Cart</h2>
        <p className="text-muted">Server-calculated prices, atomic inventory checkout, and idempotency protection</p>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {cartData.items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-panel">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cartData.items.map((it) => (
                  <tr key={it.product._id}>
                    <td>
                      <strong>{it.product.name}</strong>
                      <div className="text-muted small">Max stock: {it.product.stock}</div>
                    </td>
                    <td>{it.product.price} PKR</td>
                    <td>
                      <div className="qty-controls">
                        <button
                          className="btn-sm"
                          disabled={it.quantity <= 1}
                          onClick={() => handleUpdateQty(it.product._id, it.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="qty-value">{it.quantity}</span>
                        <button
                          className="btn-sm"
                          disabled={it.quantity >= it.product.stock}
                          onClick={() => handleUpdateQty(it.product._id, it.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{it.itemTotal} PKR</td>
                    <td>
                      <button className="btn-remove" onClick={() => handleRemove(it.product._id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cart-summary-panel">
            <h3>Order Summary</h3>
            <div className="personal-rule-banner">
              <strong>Personal Shipping Rule ($N = 671$):</strong>
              <div>Flat Shipping: <strong>50 + 671 = 721 PKR</strong></div>
              <div>Free Shipping over: <strong>1000 + 671 = 1671 PKR</strong></div>
            </div>

            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{cartData.subtotal} PKR</span>
            </div>
            <div className="summary-row">
              <span>Shipping Fee:</span>
              <span>
                {cartData.shipping === 0 ? (
                  <span className="free-badge">FREE (Subtotal &ge; 1671)</span>
                ) : (
                  `${cartData.shipping} PKR`
                )}
              </span>
            </div>
            <hr />
            <div className="summary-row total-row">
              <span>Grand Total:</span>
              <span>{cartData.total} PKR</span>
            </div>

            <div className="idempotency-box">
              <small>Active Idempotency-Key:</small>
              <code>{idempotencyKeyRef.current}</code>
            </div>

            <button
              className="btn btn-primary btn-block btn-lg"
              disabled={submitting || cartData.items.length === 0}
              onClick={handleCheckout}
            >
              {submitting ? 'Processing Order...' : 'Safe Checkout'}
            </button>
            <p className="text-muted small text-center mt-2">
              Protected against double clicks & network retries.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
