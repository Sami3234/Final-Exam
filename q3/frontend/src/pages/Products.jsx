import React, { useState, useEffect } from 'react';
import { request } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Products({ onAddToCartSuccess }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [errorPrompt, setErrorPrompt] = useState('');
  const [feedbackPrompt, setFeedbackPrompt] = useState('');

  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [saving, setSaving] = useState(false);

  const pullProducts = async () => {
    try {
      setFetching(true);
      const res = await request('/products');
      setItems(res);
    } catch (err) {
      setErrorPrompt(err.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    pullProducts();
  }, []);

  const pushToCart = async (product) => {
    setErrorPrompt('');
    setFeedbackPrompt('');
    try {
      await request('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      setFeedbackPrompt(`Added "${product.name}" to shopping bag.`);
      if (onAddToCartSuccess) onAddToCartSuccess();
      setTimeout(() => setFeedbackPrompt(''), 2500);
    } catch (err) {
      setErrorPrompt(err.message);
    }
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    setErrorPrompt('');
    setSaving(true);
    try {
      await request('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: formTitle,
          price: Number(formPrice),
          stock: Number(formStock)
        })
      });
      setFormTitle('');
      setFormPrice('');
      setFormStock('');
      pullProducts();
      setFeedbackPrompt('Item created in product inventory.');
      setTimeout(() => setFeedbackPrompt(''), 2500);
    } catch (err) {
      setErrorPrompt(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="headline-wrap">
        <h2>Hardware & Gear Catalog</h2>
        <p className="text-subtle">Explore items backed by real-time inventory validation</p>
      </div>

      {feedbackPrompt && <div className="banner-success">{feedbackPrompt}</div>}
      {errorPrompt && <div className="banner-failure">{errorPrompt}</div>}

      {user?.role === 'admin' && (
        <div className="box-card" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.8rem' }}>Admin Control: Register Inventory Item</h3>
          <form onSubmit={submitProduct} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Item Title"
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', flex: '2' }}
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            <input
              type="number"
              placeholder="Unit Rate (PKR)"
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', flex: '1' }}
              required
              min="0"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
            />
            <input
              type="number"
              placeholder="Initial Stock"
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', flex: '1' }}
              required
              min="0"
              value={formStock}
              onChange={(e) => setFormStock(e.target.value)}
            />
            <button type="submit" className="action-btn btn-dark" disabled={saving}>
              {saving ? 'Registering...' : 'Add Product'}
            </button>
          </form>
        </div>
      )}

      {fetching ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Pulling catalog records...</div>
      ) : items.length === 0 ? (
        <div className="box-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No products listed.</div>
      ) : (
        <div className="catalog-deck">
          {items.map((prod) => (
            <div key={prod._id} className="catalog-tile">
              <div>
                <div className="stock-tag">Units Left: {prod.stock}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{prod.name}</h3>
                <div className="price-tag">{prod.price} PKR</div>
              </div>
              {user?.role === 'customer' ? (
                <button
                  className="action-btn btn-teal full-width"
                  disabled={prod.stock <= 0}
                  onClick={() => pushToCart(prod)}
                >
                  {prod.stock > 0 ? 'Add to Bag' : 'Out of Stock'}
                </button>
              ) : (
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#0d9488', background: '#f0fdfa', padding: '0.45rem', borderRadius: '6px', fontWeight: '600', border: '1px solid #ccfbf1' }}>
                  Catalog Item (Active)
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
