import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn, Store, ShieldCheck, UserCheck, Headphones, UserPlus, CheckCircle2, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotMsg, setShowForgotMsg] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const resolveDestination = (userObj, requestedRedirect) => {
    if (userObj?.role === 'admin') {
      return requestedRedirect || '/admin/dashboard';
    }
    // If not admin, ignore any /admin redirect
    if (requestedRedirect && !requestedRedirect.includes('/admin')) {
      return requestedRedirect;
    }
    return '/catalogo';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (activeTab === 'login') {
      if (!email || !password) return;
      setLoading(true);
      try {
        const userObj = await login(email, password);
        const destination = resolveDestination(userObj, redirectUrl);
        navigate(destination);
      } catch (err) {
        console.error('Login error', err);
        setErrorMsg(err.message || 'Credenciales inválidas. Verifica tu correo y contraseña.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!name || !email || !password) return;
      setLoading(true);
      try {
        const userObj = await register({
          nombre: name,
          email,
          password,
          telefono: phone,
          direccion: address
        });
        setRegSuccess(true);
        setTimeout(() => {
          const destination = resolveDestination(userObj, redirectUrl);
          navigate(destination);
        }, 1200);
      } catch (err) {
        console.error('Register error', err);
        setErrorMsg(err.message || 'Error al registrar usuario.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuickLogin = (type) => {
    setErrorMsg('');
    if (type === 'cliente') {
      login('cliente@megastore.com', 'Password123').then((userObj) => {
        const destination = resolveDestination(userObj, redirectUrl);
        navigate(destination);
      }).catch(err => setErrorMsg(err.message));
    } else if (type === 'riesgo') {
      login('riesgo@megastore.com', 'Riesgo123').then((userObj) => {
        const destination = resolveDestination(userObj, redirectUrl);
        navigate(destination);
      }).catch(err => setErrorMsg(err.message));
    } else if (type === 'admin') {
      login('admin@megastore.com', 'Admin123').then((userObj) => {
        const destination = resolveDestination(userObj, redirectUrl);
        navigate(destination);
      }).catch(err => setErrorMsg(err.message));
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
              onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
            >
              <LogIn size={16} /> Iniciar Sesión
            </button>
            <button
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
            >
              <UserPlus size={16} /> Registrarse
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="status-banner-card" style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171' }}>
            <span>{errorMsg}</span>
          </div>
        )}

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
                autoComplete="username"
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
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Teléfono de contacto (Opcional)</label>
                <div className="input-icon-wrapper">
                  <Phone className="field-icon" size={18} />
                  <input
                    type="text"
                    className="form-input with-icon"
                    placeholder="Ej. +502 5555 1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección de entrega (Opcional)</label>
                <div className="input-icon-wrapper">
                  <MapPin className="field-icon" size={18} />
                  <input
                    type="text"
                    className="form-input with-icon"
                    placeholder="Ej. Avenida Reforma 12-01, Zona 10, Ciudad de Guatemala"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

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
            onClick={() => handleQuickLogin('riesgo')}
            title="Cliente con incidencias en ERP (Score 55/100 - No apto para Crédito Propio)"
          >
            <ShieldCheck size={18} style={{ color: '#f87171' }} />
            <span>Cliente Riesgo (Sin BNPL)</span>
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
