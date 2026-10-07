import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="footer-container">
      <div className="footer-content">
        {/* Brand section */}
        <div className="footer-brand">
          <div className="footer-logo">
            <Store className="footer-icon" size={24} />
            <span className="footer-brand-title">MegaStore</span>
          </div>
          <p className="footer-tagline">
            Sistema de Gestión de Órdenes y Logística Omnicanal (SGO-Logic 2026).
          </p>
        </div>

        {/* Links section */}
        <div className="footer-links">
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/carrito">Mi Carrito</Link>
          <Link to="/seguimiento">Seguimiento</Link>
          {!user ? (
            <Link to="/login">Iniciar Sesión</Link>
          ) : (
            <Link to="/catalogo">Mi Cuenta</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin/dashboard">Ops Dashboard</Link>
          )}
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p>© 2026 MegaStore Retail Group. Todos los derechos reservados.</p>
          <div className="footer-status">
            <ShieldCheck size={16} className="status-icon" />
            <span>Sistemas Omnicanal Operativos</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
