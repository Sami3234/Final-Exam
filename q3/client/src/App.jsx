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
  const [authView, setAuthView] = useState('login');
  const [currentTab, setCurrentTab] = useState('products');
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    if (!user) return;
    try {
      const data = await request('/cart');
      const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    } catch (err) {}
  };

  useEffect(() => {
    if (user) {
      fetchCartCount();
    }
  }, [user, currentTab]);

  if (loading) {
    return <div className="loading-state">Initializing CartCraft application...</div>;
  }

  if (!user) {
    return (
      <div>
        {authView === 'login' ? (
          <Login onSwitch={() => setAuthView('register')} />
        ) : (
          <Register onSwitch={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  return (
    <div>
      <header className="navbar">
        <div className="brand" onClick={() => setCurrentTab('products')}>
          CartCraft
          <span className="brand-badge">Roll N: 671</span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${currentTab === 'products' ? 'active' : ''}`}
            onClick={() => setCurrentTab('products')}
          >
            Products
          </button>
          <button
            className={`nav-btn ${currentTab === 'cart' ? 'active' : ''}`}
            onClick={() => setCurrentTab('cart')}
          >
            Cart
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
          <button
            className={`nav-btn ${currentTab === 'orders' ? 'active' : ''}`}
            onClick={() => setCurrentTab('orders')}
          >
            My Orders
          </button>

          <div className="user-badge">
            <span>{user.name}</span>
            <span className={`role-tag role-${user.role}`}>{user.role}</span>
          </div>

          <button className="nav-btn" onClick={logout}>
            Sign Out
          </button>
        </nav>
      </header>

      <main>
        {currentTab === 'products' && (
          <Products onAddToCartSuccess={fetchCartCount} />
        )}
        {currentTab === 'cart' && (
          <Cart onCheckoutSuccess={() => setCurrentTab('orders')} />
        )}
        {currentTab === 'orders' && <Orders />}
      </main>
    </div>
  );
}
