import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Store, ShieldCheck, UserCheck, Headphones, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotMsg, setShowForgotMsg] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'login') {
      if (!email || !password) return;
      setLoading(true);
      try {
        const userObj = await login(email, password);
        if (userObj.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/catalogo');
        }
      } catch (err) {
        console.error('Login error', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Mock Register
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setRegSuccess(true);
        setTimeout(() => {
          setRegSuccess(false);
          setActiveTab('login');
        }, 2000);
      }, 500);
    }
  };

  const handleQuickLogin = (type) => {
    if (type === 'cliente') {
      login('cliente@megastore.com', 'cliente123').then(() => {
        navigate('/catalogo');
      });
    } else if (type === 'admin') {
      login('admin.ops@megastore.com', 'admin123').then(() => {
        navigate('/admin/dashboard');
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-panel animate-fade-in">
        {/* Header */}
        <div className="login-header">
          <div className="login-brand">
            <div className="brand-icon-box">
              <Store size={28} />
            </div>
            <h1 className="login-title">MegaStore</h1>
          </div>
          <h2 className="login-subtitle">Sistema de Gestión y Logística Omnicanal</h2>

          {/* Mode Switcher */}
          <div className="auth-tab-switcher">
            <button
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              <LogIn size={16} /> Iniciar Sesión
            </button>
            <button
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              <UserPlus size={16} /> Registrarse
            </button>
          </div>
        </div>

        {regSuccess && (
          <div className="status-banner-card text-success" style={{ marginBottom: '1rem' }}>
            <CheckCircle2 size={20} />
            <span>¡Usuario registrado exitosamente! Inicia sesión.</span>
          </div>
        )}

        {showForgotMsg && (
          <div className="status-banner-card text-warning" style={{ marginBottom: '1rem' }}>
            <span>Se envió un enlace de recuperación a tu correo electrónico.</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {activeTab === 'register' && (
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <div className="input-icon-wrapper">
                <UserCheck className="field-icon" size={18} />
                <input
                  type="text"
                  className="form-input with-icon"
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo electrónico</label>
            <div className="input-icon-wrapper">
              <Mail className="field-icon" size={18} />
              <input
                id="email"
                type="email"
                className="form-input with-icon"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password">Contraseña</label>
              {activeTab === 'login' && (
                <button
                  type="button"
                  onClick={() => setShowForgotMsg(true)}
                  className="link-forgot"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="input-icon-wrapper">
              <Lock className="field-icon" size={18} />
              <input
                id="password"
                type="password"
                className="form-input with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Procesando...' : activeTab === 'login' ? 'Ingresar' : 'Crear Cuenta'}
            <LogIn size={18} />
          </button>
        </form>

        {/* Quick Demo Login Fillers */}
        <div className="login-separator">
          <span>O prueba rápidamente como</span>
        </div>

        <div className="quick-login-grid">
          <button
            type="button"
            className="btn-secondary btn-quick"
            onClick={() => handleQuickLogin('cliente')}
          >
            <UserCheck size={18} className="icon-orange" />
            <span>Cliente Tienda</span>
          </button>

          <button
            type="button"
            className="btn-secondary btn-quick"
            onClick={() => handleQuickLogin('admin')}
          >
            <Headphones size={18} className="icon-orange" />
            <span>Call Center / Ops Admin</span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="login-footer-note">
          <ShieldCheck size={16} />
          <span>Tu sesión es válida en todos los canales omnicanal</span>
        </div>
      </div>
    </div>
  );
};
