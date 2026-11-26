import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { request } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Orders from './pages/Orders';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [activeTab, setActiveTab] = useState('products');
  const [bagItemCount, setBagItemCount] = useState(0);

  const refreshBagCounter = async () => {
    if (!user) return;
    try {
      const response = await request('/cart');
      const sum = response.items.reduce((acc, curr) => acc + curr.quantity, 0);
      setBagItemCount(sum);
    } catch (e) {}
  };

  useEffect(() => {
    if (user) {
      refreshBagCounter();
    }
  }, [user, activeTab]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Booting CartCraft environment...</div>;
  }

  if (!user) {
    return (
      <div>
        {authMode === 'login' ? (
          <Login onSwitch={() => setAuthMode('register')} />
        ) : (
          <Register onSwitch={() => setAuthMode('login')} />
        )}
      </div>
    );
  }

  return (
    <div>
      <header className="top-bar">
        <div className="store-logo" onClick={() => setActiveTab('products')}>
          CartCraft
          <span className="pill-n">Roll: 671</span>
        </div>

        <nav className="top-nav">
          <button
            className={`tab-link ${activeTab === 'products' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Catalog
          </button>
          <button
            className={`tab-link ${activeTab === 'cart' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('cart')}
          >
            Bag
            {bagItemCount > 0 && <span className="cart-pill">{bagItemCount}</span>}
          </button>
          <button
            className={`tab-link ${activeTab === 'orders' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>

          <div className="session-chip">
            <span>{user.name}</span>
            <span className={`role-badge ${user.role}`}>{user.role}</span>
          </div>

          <button className="tab-link" onClick={logout}>
            Exit
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'products' && (
          <Products onAddToCartSuccess={refreshBagCounter} />
        )}
        {activeTab === 'cart' && (
          <Cart onCheckoutSuccess={() => setActiveTab('orders')} />
        )}
        {activeTab === 'orders' && <Orders />}
      </main>
    </div>
  );
}
