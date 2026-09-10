import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, LogOut, LayoutDashboard, Shield, Package, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ hideSearch = false, hideLinks = false }) => {
  const { totalCount } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-badge">
            <Store className="logo-icon" />
          </div>
          <div className="logo-text">
            <span className="brand-name">MegaStore</span>
            <span className="brand-sub">SGO-Logic</span>
          </div>
        </Link>

        {/* Search Bar */}
        {!hideSearch && (
          <form className="navbar-search" onSubmit={handleSearchSubmit}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Buscar electrodomésticos, tecnología, ropa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </form>
        )}

        {/* Navigation Links */}
        {!hideLinks && (
          <nav className="navbar-links">
            <Link to="/catalogo" className="nav-link">
              Catálogo
            </Link>
            <Link to="/catalogo?ofertas=true" className="nav-link nav-ofertas">
              Ofertas
            </Link>
            <Link to="/seguimiento/ORD-2026-08941" className="nav-link">
              <Package size={16} /> Mis Pedidos
            </Link>
          </nav>
        )}

        {/* Action Icons & User */}
        <div className="navbar-actions">
          {/* Cart Icon */}
          <Link to="/carrito" className="icon-btn cart-btn" title="Ver Carrito">
            <ShoppingCart size={22} />
            {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
          </Link>

          {/* User Auth Info */}
          {user ? (
            <div className="user-menu-container">
              {isAdmin && (
                <Link to="/admin/dashboard" className="btn-admin-pill" title="Panel Operativo">
                  <LayoutDashboard size={16} />
                  <span>Ops Dashboard</span>
                </Link>
              )}
              <div className="user-profile">
                <User size={18} className="user-avatar" />
                <span className="user-name">{user.nombre.split(' ')[0]}</span>
              </div>
              <button onClick={logout} className="icon-btn" title="Cerrar Sesión">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary-nav">
              <User size={18} />
              <span>Ingresar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
