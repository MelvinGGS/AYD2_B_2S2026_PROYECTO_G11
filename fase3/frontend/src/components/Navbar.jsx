import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, LogOut, LayoutDashboard, Shield, Package, Store, HelpCircle, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ProfileModal } from './ProfileModal';

export const Navbar = ({ hideSearch = false, hideLinks = false }) => {
  const { totalCount } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchTerm.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header className="navbar-container">
        <div className="navbar-content">
          {/* Brand Logo */}
          <Link to="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="logo-badge">
              <Store className="logo-icon" />
            </div>
            <div className="logo-text">
              <span className="brand-name">MegaStore</span>
              <span className="brand-sub">SGO-Logic</span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
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

          {/* Navigation Links (Desktop) */}
          {!hideLinks && (
            <nav className="navbar-links">
              <Link to="/catalogo" className="nav-link">
                Catálogo
              </Link>
              <Link to="/catalogo?ofertas=true" className="nav-link nav-ofertas">
                Ofertas
              </Link>
              {user && (
                <Link to="/seguimiento" className="nav-link">
                  <Package size={16} /> Mis Pedidos
                </Link>
              )}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-help-modal'))}
                className="nav-link"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--orange-primary)',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
                title="Centro de ayuda y atención al cliente"
              >
                <HelpCircle size={16} />
                <span>¿Necesitas ayuda?</span>
              </button>
            </nav>
          )}

          {/* Action Icons & User */}
          <div className="navbar-actions">
            {/* Cart Icon */}
            {user ? (
              <Link to="/carrito" className="icon-btn cart-btn" title="Ver Carrito" onClick={() => setMobileMenuOpen(false)}>
                <ShoppingCart size={22} />
                {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
              </Link>
            ) : (
              <Link to="/login?redirect=/carrito" className="icon-btn cart-btn" title="Iniciar sesión para acceder al carrito" onClick={() => setMobileMenuOpen(false)}>
                <ShoppingCart size={22} />
              </Link>
            )}

            {/* User Auth Info (Desktop) */}
            {user ? (
              <div className="user-menu-container">
                {isAdmin && (
                  <Link to="/admin/dashboard" className="btn-admin-pill" title="Panel Operativo" onClick={() => setMobileMenuOpen(false)}>
                    <LayoutDashboard size={16} />
                    <span>Ops Dashboard</span>
                  </Link>
                )}
                <div 
                  className="user-profile"
                  onClick={() => setShowProfileModal(true)}
                  style={{ cursor: 'pointer' }}
                  title="Gestionar mi perfil y métodos de pago"
                >
                  <User size={18} className="user-avatar" />
                  <span className="user-name">{(user.nombre || 'Usuario').split(' ')[0]}</span>
                </div>
                <button 
                  onClick={() => { logout(); navigate('/login'); }} 
                  className="icon-btn" 
                  title="Cerrar Sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary-nav">
                <User size={18} />
                <span>Ingresar</span>
              </Link>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer animate-fade-in">
            {!hideSearch && (
              <form className="mobile-search-form" onSubmit={handleSearchSubmit}>
                <Search size={16} className="mobile-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mobile-search-input"
                />
              </form>
            )}
            <div className="mobile-nav-links">
              <Link to="/catalogo" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <Store size={18} />
                <span>Catálogo</span>
              </Link>
              <Link to="/catalogo?ofertas=true" className="mobile-nav-link nav-ofertas" onClick={() => setMobileMenuOpen(false)}>
                <span>Ofertas Black Friday</span>
              </Link>
              {user && (
                <Link to="/seguimiento" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <Package size={18} />
                  <span>Mis Pedidos y Rastreo</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.dispatchEvent(new CustomEvent('open-help-modal'));
                }}
                className="mobile-nav-link"
                style={{ color: 'var(--orange-primary)' }}
              >
                <HelpCircle size={18} />
                <span>¿Necesitas ayuda?</span>
              </button>
              {user && isAdmin && (
                <Link to="/admin/dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <LayoutDashboard size={18} />
                  <span>Ops Dashboard</span>
                </Link>
              )}
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="mobile-nav-link"
                >
                  <User size={18} />
                  <span>Mi Perfil ({(user.nombre || 'Usuario').split(' ')[0]})</span>
                </button>
              )}
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="mobile-nav-link"
                  style={{ color: 'var(--status-error)' }}
                >
                  <LogOut size={18} />
                  <span>Cerrar Sesión</span>
                </button>
              ) : (
                <Link to="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <User size={18} />
                  <span>Iniciar Sesión</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
};
