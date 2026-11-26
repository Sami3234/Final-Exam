import React, { useState, useEffect } from 'react';
import { request } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Products({ onAddToCartSuccess }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await request('/products');
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    setError('');
    setActionMessage('');
    try {
      await request('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      setActionMessage(`Added "${product.name}" to cart!`);
      if (onAddToCartSuccess) onAddToCartSuccess();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await request('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          price: Number(newPrice),
          stock: Number(newStock)
        })
      });
      setNewName('');
      setNewPrice('');
      setNewStock('');
      fetchProducts();
      setActionMessage('New product added to catalog!');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Product Catalog</h2>
        <p className="text-muted">Browse available items and add them to your cart</p>
      </div>

      {actionMessage && <div className="alert-success">{actionMessage}</div>}
      {error && <div className="alert-error">{error}</div>}

      {user?.role === 'admin' && (
        <div className="card admin-panel">
          <h3>Admin Panel: Add New Product</h3>
          <form onSubmit={handleCreateProduct} className="form-inline">
            <input
              type="text"
              placeholder="Product Name"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Price (Whole Units)"
              required
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <input
              type="number"
              placeholder="Stock"
              required
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" disabled={creating}>
              {creating ? 'Adding...' : 'Create Product'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">No products found.</div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <div key={p._id} className="product-card">
              <div className="product-badge">Stock: {p.stock}</div>
              <h3>{p.name}</h3>
              <div className="product-price">{p.price} PKR</div>
              <button
                className="btn btn-primary btn-block"
                disabled={p.stock <= 0}
                onClick={() => handleAddToCart(p)}
              >
                {p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
