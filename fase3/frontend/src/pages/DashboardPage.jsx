import React, { useEffect, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Settings, RefreshCw,
  TrendingUp, AlertTriangle, Clock, CheckCircle2, MoreVertical, Store, LogOut,
  Search, ShieldCheck, FileText, LifeBuoy, MessageSquare, Send, X
} from 'lucide-react';
import {
  getDashboardMetrics,
  getInventarioUnificado,
  getClientes,
  updateEstadoOrden,
  getIncidencias,
  responderIncidenciaAdmin,
  getModoPayKlik,
  toggleModoPayKlik,
  getModoSat,
  toggleModoSat,
  getModoInventario,
  toggleModoInventario,
  getModoLogistica,
  toggleModoLogistica,
  getModoNotificaciones,
  toggleModoNotificaciones,
  getPagosContingencia,
  reprocesarPagosContingencia,
  ajustarStockInventario,
  FACTURACION_API
} from '../services/api';
import { esMetodoCreditoPropio } from '../utils/checkoutUtils';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  // Resolucion reactiva y segura del usuario con sincronizacion inmediata desde localStorage
  const [user, setUser] = useState(() => {
    if (authUser) return authUser;
    try {
      const saved = localStorage.getItem('sgologic_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    } else {
      try {
        const saved = localStorage.getItem('sgologic_user');
        if (saved) setUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, [authUser]);

  const defaultMetrics = {
    totalOrdenesHoy: 0,
    ordenesIncremento: '0 hoy',
    ordenesPendientes: 0,
    alertasActivas: 0,
    ingresosHoy: '$0.00',
    sistemas: [
      { nombre: 'Órdenes y Clientes', estado: 'Operativo', statusType: 'success', latencia: '120ms' },
      { nombre: 'Inventario Omnicanal', estado: 'Operativo', statusType: 'success', latencia: '110ms' },
      { nombre: 'Pasarela PayKlik', estado: 'Operativo', statusType: 'success', latencia: '95ms' },
      { nombre: 'SAT Facturación XML', estado: 'Operativo', statusType: 'success', latencia: '140ms' },
      { nombre: 'LogiExpress Courier', estado: 'Operativo', statusType: 'success', latencia: '80ms' },
      { nombre: 'Bus Notificaciones', estado: 'Operativo', statusType: 'success', latencia: '75ms' }
    ],
    ultimasOrdenes: [],
    ordenesOffline: false
  };

  const [metrics, setMetrics] = useState(defaultMetrics);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('TODOS');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('TODOS');
  const [modoPayklik, setModoPayklik] = useState({ deshabilitado: false, estadoServicio: 'HABILITADO' });
  const [modoSat, setModoSat] = useState({ deshabilitado: false, estadoServicio: 'HABILITADO' });
  const [modoInventario, setModoInventario] = useState({ deshabilitado: false, estadoServicio: 'HABILITADO' });
  const [modoLogistica, setModoLogistica] = useState(() => getModoLogistica());
  const [modoNotificaciones, setModoNotificaciones] = useState(() => getModoNotificaciones());
  const [pagosContingencia, setPagosContingencia] = useState([]);
  const [opsBannerMsg, setOpsBannerMsg] = useState('');
  const [togglingPayklik, setTogglingPayklik] = useState(false);
  const [togglingSat, setTogglingSat] = useState(false);
  const [reprocesandoDlq, setReprocesandoDlq] = useState(false);
  const [showAlertasModal, setShowAlertasModal] = useState(false);
  const [alertasTab, setAlertasTab] = useState('contingencia');
  const [ticketEnRespuesta, setTicketEnRespuesta] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [msgRespuestaExito, setMsgRespuestaExito] = useState('');

  const handleEnviarRespuestaTicket = async (e) => {
    e.preventDefault();
    if (!ticketEnRespuesta?.id || !textoRespuesta.trim()) return;
    setEnviandoRespuesta(true);
    try {
      await responderIncidenciaAdmin(ticketEnRespuesta.id, textoRespuesta.trim());
      setIncidencias(prev => prev.map(inc =>
        inc.id === ticketEnRespuesta.id
          ? { ...inc, respuesta: textoRespuesta.trim(), estado: 'ATENDIDA' }
          : inc
      ));
      setMsgRespuestaExito(`Respuesta registrada para el ticket TCK-${ticketEnRespuesta.id}.`);
      setTicketEnRespuesta(null);
      setTextoRespuesta('');
      setTimeout(() => setMsgRespuestaExito(''), 3500);
    } catch (err) {
      console.warn('Error al responder ticket:', err);
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const handleStatusChange = async (ordenId, newStatus) => {
    try {
      await updateEstadoOrden(ordenId, newStatus);
      await fetchMetrics();
    } catch (e) {
      console.warn('Error al cambiar estado:', e);
    }
  };

  // Datos de reserva inicial
  const defaultInventario = [
    { id: 'prod-001', sku: 'SKU-EPR-001', producto: 'Cafetera Espresso Serie X', cdNorte: 15, cdSur: 8, tiendas: 42, total: 65, estado: 'Óptimo' },
    { id: 'prod-002', sku: 'SKU-REF-002', producto: 'Refrigerador Multi-Door 24 cu.ft', cdNorte: 2, cdSur: 1, tiendas: 5, total: 8, estado: 'Crítico' },
    { id: 'prod-003', sku: 'SKU-ROB-003', producto: 'Robot Aspirador Laser LiDAR', cdNorte: 25, cdSur: 18, tiendas: 60, total: 103, estado: 'Óptimo' },
    { id: 'prod-004', sku: 'SKU-SMA-004', producto: 'Smartwatch V3 Pro AMOLED', cdNorte: 40, cdSur: 32, tiendas: 110, total: 182, estado: 'Óptimo' },
    { id: 'prod-005', sku: 'SKU-AUR-005', producto: 'Auriculares Noise Cancelling Pro', cdNorte: 10, cdSur: 5, tiendas: 18, total: 33, estado: 'Bajo' },
    { id: 'prod-006', sku: 'SKU-OLED-006', producto: 'Smart TV OLED 4K 65"', cdNorte: 4, cdSur: 3, tiendas: 9, total: 16, estado: 'Bajo' }
  ];

  const defaultClientes = [
    { id: 'CLI-1', nombre: 'Melvin Garcia', email: 'cliente@megastore.com', canal: 'Web Store', ordenes: 1, totalGasto: 227.79, score: 85, aptoBnpl: true, saldoDeudor: 0, saldoDisponible: 5000, estado: 'Activo' },
    { id: 'CLI-2', nombre: 'Roberto Morales', email: 'riesgo@megastore.com', canal: 'Web Store', ordenes: 0, totalGasto: 0.00, score: 55, aptoBnpl: false, saldoDeudor: 0, saldoDisponible: 5000, estado: 'Riesgo Crediticio' },
    { id: 'CLI-3', nombre: 'Administrador Ops', email: 'admin@megastore.com', canal: 'Call Center', ordenes: 0, totalGasto: 0.00, score: 100, aptoBnpl: true, saldoDeudor: 0, saldoDisponible: 5000, estado: 'Admin Ops' }
  ];

  const [inventario, setInventario] = useState(defaultInventario);
  const [clientes, setClientes] = useState(defaultClientes);
  const [incidencias, setIncidencias] = useState([]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [dataMetrics, dataInventario, dataClientes, dataIncidencias, dataModoPk, dataContingencia, dataModoSat, dataModoInv] = await Promise.all([
        getDashboardMetrics(),
        getInventarioUnificado(),
        getClientes(),
        getIncidencias(),
        getModoPayKlik(),
        getPagosContingencia(),
        getModoSat(),
        getModoInventario()
      ]);
      if (dataMetrics) {
        setMetrics({
          ...defaultMetrics,
          ...dataMetrics,
          sistemas: Array.isArray(dataMetrics?.sistemas) && dataMetrics.sistemas.length > 0 ? dataMetrics.sistemas : defaultMetrics.sistemas,
          ultimasOrdenes: Array.isArray(dataMetrics?.ultimasOrdenes) ? dataMetrics.ultimasOrdenes : []
        });
      }
      if (dataModoPk) setModoPayklik(dataModoPk);
      if (dataModoSat) setModoSat(dataModoSat);
      if (dataModoInv) setModoInventario(dataModoInv);
      setModoLogistica(getModoLogistica());
      setModoNotificaciones(getModoNotificaciones());
      if (Array.isArray(dataContingencia)) setPagosContingencia(dataContingencia);
      if (Array.isArray(dataInventario) && dataInventario.length > 0) {
        setInventario(dataInventario);
      }
      if (Array.isArray(dataIncidencias)) {
        setIncidencias(dataIncidencias);
      }
      if (Array.isArray(dataClientes) && dataClientes.length > 0) {
        const enriched = dataClientes.map(c => ({
          ...c,
          ordenes: typeof c?.ordenes === 'number' ? c.ordenes : 0,
          totalGasto: typeof c?.totalGasto === 'number' ? c.totalGasto : 0.00
        }));
        setClientes(enriched);
      }
    } catch (e) {
      console.error('Error cargando datos del dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReabastecerStock = async (item, idx) => {
    const prodId = item.id || `prod-00${idx + 1}`;
    try {
      await ajustarStockInventario(prodId, 'CD_NORTE', 10);
      setOpsBannerMsg(`Stock incrementado (+10 uds en CD Norte) para ${item.sku} - ${item.producto}.`);
      await fetchMetrics();
      setTimeout(() => setOpsBannerMsg(''), 4000);
    } catch (err) {
      setOpsBannerMsg(`Error al ajustar stock: ${err.message}`);
    }
  };

  const handleTogglePayklikMode = async () => {
    setTogglingPayklik(true);
    try {
      const nextState = !modoPayklik.deshabilitado;
      const res = await toggleModoPayKlik(nextState);
      setModoPayklik(res);
      setOpsBannerMsg(
        res.deshabilitado
          ? 'Pasarela PayKlik DESHABILITADA: Los nuevos cobros con tarjeta activaran el Circuit Breaker y se encolaran en RabbitMQ DLQ.'
          : 'Pasarela PayKlik HABILITADA: Servicio en linea.'
      );
      await fetchMetrics();
    } catch (err) {
      setOpsBannerMsg('No se pudo conectar con la pasarela de pagos: Servicio fuera de línea.');
    } finally {
      setTogglingPayklik(false);
    }
  };

  const handleToggleSatMode = async () => {
    setTogglingSat(true);
    try {
      const nextState = !modoSat.deshabilitado;
      const res = await toggleModoSat(nextState);
      setModoSat(res);
      setOpsBannerMsg(
        res.deshabilitado
          ? 'Certificador SAT FEL DESHABILITADO: Modo contingencia activado; emision de DTE diferida.'
          : 'Certificador SAT FEL HABILITADO: Emision y validacion de DTE en linea.'
      );
      await fetchMetrics();
    } catch (err) {
      setOpsBannerMsg('No se pudo conectar con el servicio de facturación SAT: Servicio fuera de línea.');
    } finally {
      setTogglingSat(false);
    }
  };

  const handleToggleInventarioMode = async () => {
    try {
      const nextState = !modoInventario.deshabilitado;
      const res = await toggleModoInventario(nextState);
      setModoInventario(res);
      setOpsBannerMsg(
        res.deshabilitado
          ? 'Reserva de Inventario DESHABILITADA: Modo auditoria de stock activado.'
          : 'Reserva de Inventario HABILITADA: Descuento y bloqueo optimista en linea.'
      );
      await fetchMetrics();
    } catch (err) {
      setOpsBannerMsg('No se pudo conectar con el servicio central de inventario: Servicio fuera de línea.');
    }
  };

  const handleToggleLogisticaMode = async () => {
    const nextState = !modoLogistica.deshabilitado;
    const res = toggleModoLogistica(nextState);
    setModoLogistica(res);
    setOpsBannerMsg(
      nextState
        ? 'Generador de Guias LogiExpress DESHABILITADO: Despachos retenidos en cola de asignacion.'
        : 'Generador de Guias LogiExpress HABILITADO: Asignacion automatica de guias LEX-GT activa.'
    );
    await fetchMetrics();
  };

  const handleToggleNotificacionesMode = async () => {
    const nextState = !modoNotificaciones.deshabilitado;
    const res = toggleModoNotificaciones(nextState);
    setModoNotificaciones(res);
    setOpsBannerMsg(
      nextState
        ? 'Canal de Notificaciones SSE DESHABILITADO: Modo silencioso de eventos activado.'
        : 'Canal de Notificaciones SSE HABILITADO: Streaming reactivo Server-Sent Events en linea.'
    );
    await fetchMetrics();
  };

  const handleReprocesarDlq = async () => {
    setReprocesandoDlq(true);
    try {
      const res = await reprocesarPagosContingencia();
      const conList = (metrics?.ultimasOrdenes || []).filter(o => o?.estado === 'PAGO_EN_CONTINGENCIA');
      for (const o of conList) {
        try {
          await updateEstadoOrden(o.id, 'EN_PREPARACION');
        } catch (e) {}
      }
      setOpsBannerMsg(`Cola DLQ reprocesada exitosamente: ${res?.reprocesados || 0} pagos recuperados y conciliados en el sistema.`);
      await fetchMetrics();
    } catch (err) {
      setOpsBannerMsg(`Error al reprocesar DLQ: ${err.message}`);
    } finally {
      setReprocesandoDlq(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchMetrics();
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login?redirect=/admin/dashboard" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="app-container">
        <main className="main-content animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
          <div className="glass-panel" style={{ maxWidth: 540, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--orange-primary)', marginBottom: '1.25rem' }}>
              <ShieldCheck size={56} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Acceso Restringido
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
              Esta sección está reservada exclusivamente para el personal operativo (Call Center / Ops Admin). Tu cuenta actual (<strong style={{ color: 'var(--orange-primary)' }}>{user.email}</strong>) tiene permisos de <strong>Cliente</strong>.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => navigate('/catalogo')} className="btn-primary">
                Ir al Catálogo
              </button>
              <button onClick={() => { logout(); navigate('/login'); }} className="btn-secondary">
                Cambiar de Cuenta
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'EN_PREPARACION':
      case 'Empacando': return <span className="badge badge-orange">En preparación</span>;
      case 'EN_TRANSITO':
      case 'Enviado': return <span className="badge badge-info">En tránsito</span>;
      case 'ENTREGADA': return <span className="badge badge-success">Entregada</span>;
      case 'FACTURADA': return <span className="badge badge-info">Facturada</span>;
      case 'PAGADA': return <span className="badge badge-info">Pagada</span>;
      case 'PAGO_EN_CONTINGENCIA': return <span className="badge badge-warning">Contingencia DLQ</span>;
      case 'CANCELADA':
      case 'INVENTARIO_INSUFICIENTE': return <span className="badge badge-error">Cancelada</span>;
      default: return <span className="badge badge-warning">Procesando</span>;
    }
  };

  const filteredOrders = (metrics?.ultimasOrdenes || []).filter(o => {
    if (!o) return false;
    const oId = (o.id || '').toLowerCase();
    const oClient = (o.clienteNombre || o.cliente || '').toLowerCase();
    const s = (orderSearch || '').toLowerCase();
    const matchesSearch = oId.includes(s) || oClient.includes(s);
    const matchesFilter = orderStatusFilter === 'TODOS' || o.estado === orderStatusFilter;
    const isCredito = esMetodoCreditoPropio(o.metodoPago);
    const matchesPayment = orderPaymentFilter === 'TODOS' ||
      (orderPaymentFilter === 'credito_propio' ? isCredito : !isCredito);
    return matchesSearch && matchesFilter && matchesPayment;
  });

  return (
    <div className="dashboard-layout">
      {/* Side Navigation Drawer */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="logo-badge">
            <Store size={22} />
          </div>
          <div>
            <h2 className="brand-title">MegaStore Ops</h2>
            <span className="brand-role">Admin Dashboard</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Panel de Control</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'inventario' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventario')}
          >
            <Package size={20} />
            <span>Inventario Unificado</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'pedidos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            <ShoppingBag size={20} />
            <span>Gestión de Pedidos</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('clientes')}
          >
            <Users size={20} />
            <span>Clientes Omnicanal</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'soporte' ? 'active' : ''}`}
            onClick={() => setActiveTab('soporte')}
          >
            <LifeBuoy size={20} />
            <span>Soporte e Incidencias</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <Settings size={20} />
            <span>Configuración</span>
          </button>
        </nav>

        {/* User Footer */}
        <div className="sidebar-user-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', gap: '0.75rem' }}>
          <div className="user-info" style={{ overflow: 'hidden' }}>
            <span className="user-name-label" style={{ display: 'block', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nombre || 'Admin Operativo'}
            </span>
            <span className="user-email-sub" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || 'admin@megastore.com'}
            </span>
          </div>
          <button 
            onClick={() => { logout(); navigate('/login'); }} 
            className="btn-secondary btn-sm" 
            title="Cerrar sesión"
            style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <LogOut size={14} />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="dashboard-main animate-fade-in">
        {/* Mobile Navigation Tabs */}
        <div className="dashboard-mobile-tabs">
          <button
            type="button"
            className={`mobile-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={15} />
            <span>Resumen</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${activeTab === 'inventario' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventario')}
          >
            <Package size={15} />
            <span>Inventario</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${activeTab === 'pedidos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            <ShoppingBag size={15} />
            <span>Pedidos</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('clientes')}
          >
            <Users size={15} />
            <span>Clientes</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${activeTab === 'soporte' ? 'active' : ''}`}
            onClick={() => setActiveTab('soporte')}
          >
            <LifeBuoy size={15} />
            <span>Soporte</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <Settings size={15} />
            <span>Config</span>
          </button>
        </div>

        {/* Header Bar */}
        <header className="dashboard-header">
          <div>
            <h1 className="header-title">
              {activeTab === 'dashboard' && 'Dashboard Operativo'}
              {activeTab === 'inventario' && 'Inventario Unificado (32 Tiendas + 2 CD)'}
              {activeTab === 'pedidos' && 'Gestión de Pedidos Omnicanal'}
              {activeTab === 'clientes' && 'Directorio de Clientes Omnicanal'}
              {activeTab === 'soporte' && 'Centro de Atención y Soporte de Incidencias'}
              {activeTab === 'config' && 'Configuración de Parámetros SGO-Logic'}
            </h1>
            <p className="header-subtitle">Monitoreo y control centralizado MegaStore 2026.</p>
          </div>

          <div className="header-actions">
            <Link to="/catalogo" className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              <Store size={16} /> Ver Catálogo Público
            </Link>

            <button onClick={fetchMetrics} className="btn-primary btn-sm">
              <RefreshCw size={16} className={loading ? 'spin-slow' : ''} />
              <span>Actualizar datos</span>
            </button>

            <button 
              onClick={() => { logout(); navigate('/login'); }} 
              className="btn-secondary btn-sm" 
              title="Cerrar sesión"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--border-medium)', color: 'var(--text-main)' }}
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {opsBannerMsg && (
          <div
            className="glass-panel"
            style={{
              marginBottom: '1rem',
              padding: '0.85rem 1.15rem',
              borderLeft: '4px solid var(--orange-primary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(249, 115, 22, 0.1)'
            }}
          >
            <span style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{opsBannerMsg}</span>
            <button onClick={() => setOpsBannerMsg('')} className="btn-secondary btn-sm">Cerrar</button>
          </div>
        )}

        {loading ? (
          <div className="loading-container glass-panel">
            <div className="spinner"></div>
            <p>Sincronizando estado con arquitectura SGO-Logic...</p>
          </div>
        ) : (
          <div className="dashboard-tab-content">

            {/* TAB 1: PANEL DE CONTROL */}
            {activeTab === 'dashboard' && (
              <div className="dashboard-body-grid">
                {metrics?.ordenesOffline && (
                  <div
                    className="glass-panel"
                    style={{
                      marginBottom: '1rem',
                      padding: '1rem 1.25rem',
                      borderLeft: '4px solid #ef4444',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <AlertTriangle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>Aviso de Operación: Servicio de Órdenes Fuera de Línea</strong>
                      <span style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                        No se pudo establecer conexión con el servicio principal de órdenes. Los datos en vivo y transacciones no están disponibles en este momento.
                      </span>
                    </div>
                  </div>
                )}

                {/* Bento Metrics Cards Grid */}
                <section className="bento-metrics-grid">
                  <div className="metric-card glass-panel">
                    <div className="metric-header">
                      <span>Órdenes Hoy</span>
                      <ShoppingBag size={20} className="icon-orange" />
                    </div>
                    <div className="metric-value">{(metrics?.totalOrdenesHoy ?? 0).toLocaleString()}</div>
                    <div className="metric-footer text-success">
                      <TrendingUp size={14} />
                      <span>{metrics?.ordenesIncremento || '0 hoy'}</span>
                    </div>
                  </div>

                  <div className="metric-card glass-panel">
                    <div className="metric-header">
                      <span>Pendientes por despachar</span>
                      <Clock size={20} className="icon-orange" />
                    </div>
                    <div className="metric-value">{metrics?.ordenesPendientes ?? 0}</div>
                    <div className="metric-footer text-warning">
                      <span>Requiere atención inmediata</span>
                    </div>
                  </div>

                  <div 
                    className="metric-card glass-panel border-alert"
                    onClick={() => setShowAlertasModal(true)}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    title="Haga clic para auditar alertas, revisar microservicios y ver logs"
                  >
                    <div className="metric-header text-error">
                      <span>Alertas de Servicio</span>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="metric-value text-error">{metrics?.alertasActivas ?? 0}</div>
                    <div className="metric-footer text-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{(metrics?.alertasActivas ?? 0) > 0 ? 'Contingencia o cola DLQ activa' : 'Todos los servicios estables'}</span>
                      <span style={{ fontSize: '0.72rem', textDecoration: 'underline', color: 'var(--text-muted)' }}>Auditar</span>
                    </div>
                  </div>

                  <div className="metric-card glass-panel">
                    <div className="metric-header">
                      <span>Ingresos Hoy</span>
                      <TrendingUp size={20} className="icon-orange" />
                    </div>
                    <div className="metric-value">{metrics?.ingresosHoy || '$0.00'}</div>
                    <div className="metric-footer text-success">
                      <span>Facturación conciliada</span>
                    </div>
                  </div>
                </section>

                {/* Main Content Area Grid */}
                <div className="ops-content-grid">
                  <div className="ops-left-column">
                    <section className="orders-table-card glass-panel">
                      <div className="table-card-header">
                        <h3>Órdenes Recientes SGO-Logic</h3>
                        <button className="link-action" onClick={() => setActiveTab('pedidos')}>Ver todas</button>
                      </div>

                      <div className="table-responsive">
                        <table className="ops-table">
                          <thead>
                            <tr>
                              <th>ID Pedido</th>
                              <th>Cliente</th>
                              <th>Estado</th>
                              <th>Canal</th>
                              <th>Total</th>
                              <th className="text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metrics?.ultimasOrdenes?.map((ord) => (
                              <tr key={ord.id}>
                                <td className="font-mono text-orange">{ord.id}</td>
                                <td>{ord.clienteNombre || ord.cliente || 'Cliente Omnicanal'}</td>
                                <td>{getStatusBadge(ord.estado)}</td>
                                <td><span className="channel-tag">{ord.canal || 'Web Store'}</span></td>
                                <td className="font-bold">${(Number(ord.total) || 0).toFixed(2)}</td>
                                <td className="text-right">
                                  <Link to={`/seguimiento/${ord.id}`} className="icon-btn-sm" title="Ver Seguimiento">
                                    <MoreVertical size={16} />
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </div>

                  <div className="ops-right-column">
                    <section className="systems-health-card glass-panel">
                      <h3>Estado de Servicios e Integraciones</h3>
                      <div className="systems-list">
                        {metrics?.sistemas?.map((sys, idx) => (
                          <div key={idx} className="system-row">
                            <div className="system-info">
                              <CheckCircle2
                                size={18}
                                className={sys.statusType === 'success' ? 'text-success' : 'text-warning'}
                              />
                              <span className="system-name">{sys.nombre}</span>
                            </div>
                            <div className="system-meta">
                              <span className={`badge ${sys.statusType === 'success' ? 'badge-success' : 'badge-error'}`}>
                                {sys.estado}
                              </span>
                              <span className="system-lat">{sys.latencia}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="inventory-critical-card glass-panel">
                      <h3>Inventario Crítico en Almacén</h3>
                      <div className="critical-list">
                        {inventario
                          .filter(item => item.estado !== 'Óptimo' || item.total <= 20)
                          .slice(0, 3)
                          .map((item, idx) => (
                            <div key={idx} className="critical-item">
                              <div>
                                <span className="sku-code">{item.sku}</span>
                                <span className="sku-name">{item.producto}</span>
                              </div>
                              <span className={`stock-alert-tag ${item.total <= 10 ? 'text-error' : 'text-warning'}`}>
                                {item.total} unidades
                              </span>
                            </div>
                          ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INVENTARIO UNIFICADO */}
            {activeTab === 'inventario' && (
              <div className="tab-pane-container glass-panel">
                <div className="tab-pane-header">
                  <div>
                    <h2>Vista Unificada de Existencias</h2>
                    <p>Consolidación lógica de stock en 2 Centros de Distribución y 32 tiendas físicas con reserva temporal automática.</p>
                  </div>
                  <span className="badge badge-orange">Sync Tiempo Real</span>
                </div>

                <div className="table-responsive">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Código SKU</th>
                        <th>Producto</th>
                        <th>CD Norte</th>
                        <th>CD Sur</th>
                        <th>32 Tiendas POS</th>
                        <th>Stock Total</th>
                        <th>Estado Stock</th>
                        <th className="text-right">Reabastecimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventario.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-mono text-orange">{item.sku}</td>
                          <td className="font-bold">{item.producto}</td>
                          <td>{item.cdNorte} und.</td>
                          <td>{item.cdSur} und.</td>
                          <td>{item.tiendas} und.</td>
                          <td className="font-bold">{item.total} und.</td>
                          <td>
                            <span className={`badge ${item.estado === 'Óptimo' ? 'badge-success' : item.estado === 'Bajo' ? 'badge-warning' : 'badge-error'}`}>
                              {item.estado}
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              className="btn-secondary btn-sm"
                              onClick={() => handleReabastecerStock(item, idx)}
                              title="Ingresar lote de +10 unidades al Centro de Distribución Norte"
                            >
                              +10 CD Norte
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: GESTIÓN DE PEDIDOS */}
            {activeTab === 'pedidos' && (
              <div className="tab-pane-container glass-panel">
                <div className="tab-pane-header">
                  <div>
                    <h2>Control Centralizado de Pedidos</h2>
                    <p>Filtra y gestiona las órdenes generadas desde Web, App Móvil o Call Center.</p>
                  </div>
                </div>

                {/* Filter bar */}
                <div className="orders-filter-bar">
                  <div className="input-icon-wrapper" style={{ flex: 1 }}>
                    <Search size={18} className="field-icon" />
                    <input
                      type="text"
                      className="form-input with-icon"
                      placeholder="Buscar por ID de orden o cliente..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="form-input filter-select-status"
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                  >
                    <option value="TODOS">Todos los estados</option>
                    <option value="CREADA">Creada</option>
                    <option value="PAGO_EN_CONTINGENCIA">En Contingencia (DLQ)</option>
                    <option value="PAGADA">Pagada</option>
                    <option value="EN_PREPARACION">En Preparación</option>
                    <option value="EN_TRANSITO">En Tránsito</option>
                    <option value="ENTREGADA">Entregada</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>

                  <select
                    className="form-input filter-select-payment"
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                  >
                    <option value="TODOS">Todos los métodos de pago</option>
                    <option value="credito_propio">Crédito Propio (BNPL 30d)</option>
                    <option value="otros">Contado / PayKlik</option>
                  </select>
                </div>

                <div className="table-responsive">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>ID Pedido</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Canal</th>
                        <th>Método Pago</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th className="text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((ord) => {
                        const esEstadoFinal = ord.estado === 'ENTREGADA' || ord.estado === 'CANCELADA' || ord.estado === 'INVENTARIO_INSUFICIENTE';
                        const tieneFactura = ['FACTURADA', 'EN_PREPARACION', 'EN_TRANSITO', 'ENTREGADA', 'PAGADA'].includes(ord.estado);
                        return (
                          <tr key={ord.id}>
                            <td className="font-mono text-orange">{ord.id}</td>
                            <td>{new Date(ord.fechaCreacion || ord.fecha || Date.now()).toLocaleDateString()}</td>
                            <td className="font-bold">{ord.clienteNombre || ord.cliente || 'Cliente Omnicanal'}</td>
                            <td><span className="channel-tag">{ord.canal || 'Web Store'}</span></td>
                            <td className="font-label-sm">
                              {esMetodoCreditoPropio(ord.metodoPago) ? (
                                <span className="badge badge-warning" style={{ background: 'rgba(255, 107, 0, 0.15)', color: 'var(--orange-primary)', border: '1px solid rgba(255, 107, 0, 0.35)', fontWeight: 600 }}>
                                  Crédito Propio (30d)
                                </span>
                              ) : (
                                ord.metodoPago || 'PayKlik'
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {getStatusBadge(ord.estado)}
                                <select
                                  value={ord.estado}
                                  disabled={esEstadoFinal}
                                  onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                                  className="form-input"
                                  style={{
                                    padding: '0.2rem 0.4rem',
                                    fontSize: '0.75rem',
                                    width: 'auto',
                                    background: 'var(--bg-card-solid)',
                                    opacity: esEstadoFinal ? 0.55 : 1,
                                    cursor: esEstadoFinal ? 'not-allowed' : 'pointer'
                                  }}
                                  title={esEstadoFinal ? 'Estado terminal no modificable' : 'Actualizar estado operativo'}
                                >
                                  <option value="CREADA">Cambiar: Creada</option>
                                  <option value="PAGO_EN_CONTINGENCIA">Cambiar: Contingencia DLQ</option>
                                  <option value="PAGADA">Cambiar: Pagada</option>
                                  <option value="FACTURADA">Cambiar: Facturada</option>
                                  <option value="EN_PREPARACION">Cambiar: En preparación</option>
                                  <option value="EN_TRANSITO">Cambiar: En tránsito</option>
                                  <option value="ENTREGADA">Cambiar: Entregada</option>
                                  <option value="CANCELADA">Cambiar: Cancelada</option>
                                </select>
                              </div>
                            </td>
                            <td className="font-bold">${(Number(ord.total) || 0).toFixed(2)}</td>
                            <td className="text-right">
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <Link to={`/seguimiento/${ord.id}`} className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                                  Ver Tracking
                                </Link>
                                {tieneFactura ? (
                                  <a
                                    href={`${FACTURACION_API}/orden/${ord.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-secondary btn-sm"
                                    style={{ textDecoration: 'none', color: 'var(--orange-primary)' }}
                                    title="Descargar comprobante fiscal SAT FEL XML"
                                  >
                                    Factura XML
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '4px 6px' }}>
                                    Sin SAT
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: CLIENTES OMNICANAL */}
            {activeTab === 'clientes' && (
              <div className="tab-pane-container glass-panel">
                <div className="tab-pane-header">
                  <div>
                    <h2>Directorio Unificado de Clientes</h2>
                    <p>Historial comercial, scoring crediticio BNPL (30 días) y saldo disponible en todos los canales.</p>
                  </div>
                  <span className="badge badge-info">{clientes.length} Clientes Registrados</span>
                </div>

                <div className="table-responsive">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>ID Cliente</th>
                        <th>Nombre</th>
                        <th>Correo electrónico</th>
                        <th>Canal</th>
                        <th>Órdenes</th>
                        <th>Total Invertido</th>
                        <th>Scoring BNPL (30d)</th>
                        <th>Cupo Disponible</th>
                        <th>Clasificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.map((cli) => (
                        <tr key={cli.id}>
                          <td className="font-mono text-orange">{cli.id}</td>
                          <td className="font-bold">{cli.nombre}</td>
                          <td>{cli.email}</td>
                          <td><span className="channel-tag">{cli.canal}</span></td>
                          <td>{cli.ordenes} compras</td>
                          <td className="font-bold text-orange">${(Number(cli.totalGasto) || 0).toFixed(2)}</td>
                          <td>
                            <span className={`badge ${(cli.score ?? 85) >= 70 ? 'badge-success' : 'badge-error'}`}>
                              {cli.score ?? 85}/100 ({(cli.score ?? 85) >= 70 ? 'Apto' : 'No Apto'})
                            </span>
                          </td>
                          <td className="font-mono">
                            ${Number(cli.saldoDisponible ?? 5000).toFixed(2)}
                            {Number(cli.saldoDeudor || 0) > 0 && (
                              <span style={{ display: 'block', fontSize: '0.72rem', color: '#fbbf24' }}>
                                Deuda: ${Number(cli.saldoDeudor).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${cli.estado === 'VIP' ? 'badge-orange' : cli.estado === 'Riesgo Crediticio' ? 'badge-error' : 'badge-success'}`}>
                              {cli.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: SOPORTE E INCIDENCIAS */}
            {activeTab === 'soporte' && (
              <div className="tab-pane-container glass-panel">
                <div className="tab-pane-header">
                  <div>
                    <h2>Gestión de Incidencias de Clientes</h2>
                    <p>Reportes de problemas, cambios y solicitudes desde la vista de seguimiento del cliente.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {msgRespuestaExito && (
                      <span className="badge badge-success" style={{ animation: 'fadeIn 0.3s ease' }}>
                        {msgRespuestaExito}
                      </span>
                    )}
                    <span className="badge badge-warning">{(incidencias || []).length} Registradas</span>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>ID Ticket</th>
                        <th>Orden Asociada</th>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Detalle del Cliente</th>
                        <th>Respuesta Operador</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(incidencias || []).length === 0 ? (
                        <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>No hay incidencias reportadas.</td></tr>
                      ) : (
                        (incidencias || []).map((inc) => (
                          <tr key={inc.id}>
                            <td className="font-mono text-orange">TCK-{inc.id}</td>
                            <td className="font-mono">{inc.ordenId}</td>
                            <td>{inc.fecha ? new Date(inc.fecha).toLocaleString() : 'Reciente'}</td>
                            <td>
                              <span className={`badge ${inc.tipoEvento?.includes('credito') ? 'badge-orange' : 'badge-warning'}`}>
                                {inc.tipoEvento?.replace('INCIDENCIA_', '').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${inc.estado === 'ATENDIDA' || inc.respuesta ? 'badge-success' : 'badge-warning'}`}>
                                {inc.estado === 'ATENDIDA' || inc.respuesta ? 'ATENDIDA' : 'PENDIENTE'}
                              </span>
                            </td>
                            <td style={{maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={inc.detalle}>
                              {inc.detalle}
                            </td>
                            <td style={{maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={inc.respuesta || 'Sin respuesta aún'}>
                              {inc.respuesta ? (
                                <span style={{ color: '#10b981', fontSize: '0.85rem' }}>{inc.respuesta}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>Sin respuesta</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <button 
                                  onClick={() => {
                                    setTicketEnRespuesta(inc);
                                    setTextoRespuesta(inc.respuesta || '');
                                  }}
                                  className="btn-primary btn-sm"
                                  title="Responder o actualizar respuesta al cliente"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem' }}
                                >
                                  <MessageSquare size={13} />
                                  {inc.respuesta ? 'Editar' : 'Responder'}
                                </button>
                                <button 
                                  onClick={() => {
                                    setOrderSearch(inc.ordenId);
                                    setOrderStatusFilter('TODOS');
                                    setActiveTab('pedidos');
                                  }} 
                                  className="btn-secondary btn-sm"
                                  style={{ padding: '0.3rem 0.6rem' }}
                                >
                                  Ver Pedido
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: CONFIGURACIÓN Y RESILIENCIA DE MICROSERVICIOS */}
            {activeTab === 'config' && (
              <div className="tab-pane-container glass-panel">
                <div className="tab-pane-header">
                  <div>
                    <h2>Panel de Control de Disponibilidad y Resiliencia (Deshabilitar / Habilitar)</h2>
                    <p>Gestiona en tiempo real la disponibilidad de cada microservicio, simula fallos y prueba la tolerancia a caidas con colas RabbitMQ y DLQ.</p>
                  </div>
                </div>

                <div className="config-grid">
                  {/* SERVICIO 1: PAGOS Y PAYKLIK */}
                  <div className="config-card">
                    <h4>1. Pasarela de Pagos PayKlik</h4>
                    <p>Control del servicio externo de cobro. Al deshabilitarse, los pagos con tarjeta activan el Circuit Breaker y se encolan en la DLQ de RabbitMQ.</p>
                    <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Estado del servicio:</span>
                      <span className={`badge ${modoPayklik.deshabilitado ? 'badge-error' : 'badge-success'}`}>
                        {modoPayklik.deshabilitado ? 'DESHABILITADO (CONTINGENCIA DLQ)' : 'HABILITADO (OPERATIVO)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleTogglePayklikMode}
                        disabled={togglingPayklik}
                        className={modoPayklik.deshabilitado ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                        style={!modoPayklik.deshabilitado ? { borderColor: '#ef4444', color: '#f87171' } : {}}
                      >
                        {togglingPayklik ? 'Actualizando pasarela...' : (modoPayklik.deshabilitado ? 'Habilitar Pasarela PayKlik' : 'Deshabilitar Pasarela PayKlik')}
                      </button>

                      <button
                        type="button"
                        onClick={handleReprocesarDlq}
                        className="btn-secondary btn-sm"
                        disabled={reprocesandoDlq || pagosContingencia.length === 0}
                        style={{ borderColor: '#10b981', color: '#34d399' }}
                      >
                        {reprocesandoDlq ? 'Drenando cola...' : `Drenar y Reprocesar DLQ (${pagosContingencia.length})`}
                      </button>
                    </div>
                  </div>

                  {/* SERVICIO 2: FACTURACIÓN FEL Y AS/400 */}
                  <div className="config-card">
                    <h4>2. Certificador SAT FEL & AS/400</h4>
                    <p>Emision de facturas electronicas DTE y enlace contable con el ERP legado IBM iSeries AS/400.</p>
                    <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Estado del certificador:</span>
                      <span className={`badge ${modoSat.deshabilitado ? 'badge-error' : 'badge-success'}`}>
                        {modoSat.deshabilitado ? 'DESHABILITADO (BUFFER DIFERIDO)' : 'HABILITADO (CERTIFICACION SAT)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleToggleSatMode}
                        disabled={togglingSat}
                        className={modoSat.deshabilitado ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                        style={!modoSat.deshabilitado ? { borderColor: '#ef4444', color: '#f87171' } : {}}
                      >
                        {togglingSat ? 'Actualizando certificador...' : (modoSat.deshabilitado ? 'Habilitar Facturacion SAT' : 'Deshabilitar Facturacion SAT')}
                      </button>

                      <a
                        href={`${FACTURACION_API}/as400/ultimo-csv`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                        title="Descargar ultimo archivo CSV conciliado para el ERP AS/400"
                      >
                        <FileText size={14} className="icon-orange" />
                        <span>Exportar Lote AS/400 (.csv)</span>
                      </a>
                    </div>
                  </div>

                  {/* SERVICIO 3: INVENTARIO */}
                  <div className="config-card">
                    <h4>3. Servicio Central de Inventario</h4>
                    <p>Gestion de stock omnicanal (CD Norte, CD Sur y tiendas POS) con bloqueo optimista de 15 minutos.</p>
                    <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Reserva en tiempo real:</span>
                      <span className={`badge ${modoInventario.deshabilitado ? 'badge-error' : 'badge-success'}`}>
                        {modoInventario.deshabilitado ? 'DESHABILITADO (MODO AUDITORIA)' : 'HABILITADO (EN LINEA)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleToggleInventarioMode}
                        className={modoInventario.deshabilitado ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                        style={!modoInventario.deshabilitado ? { borderColor: '#ef4444', color: '#f87171' } : {}}
                      >
                        {modoInventario.deshabilitado ? 'Habilitar Reserva Stock' : 'Deshabilitar Reserva Stock'}
                      </button>
                    </div>
                  </div>

                  {/* SERVICIO 4: LOGÍSTICA */}
                  <div className="config-card">
                    <h4>4. Servicio Courier LogiExpress</h4>
                    <p>Despacho inteligente y emision automatica de codigos de rastreo LEX-GT para entregas y pickup.</p>
                    <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Generador de guias:</span>
                      <span className={`badge ${modoLogistica.deshabilitado ? 'badge-error' : 'badge-success'}`}>
                        {modoLogistica.deshabilitado ? 'DESHABILITADO (DESPACHO EN ESPERA)' : 'HABILITADO (OPERATIVO)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleToggleLogisticaMode}
                        className={modoLogistica.deshabilitado ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                        style={!modoLogistica.deshabilitado ? { borderColor: '#ef4444', color: '#f87171' } : {}}
                      >
                        {modoLogistica.deshabilitado ? 'Habilitar Despacho' : 'Deshabilitar Despacho'}
                      </button>
                    </div>
                  </div>

                  {/* SERVICIO 5: NOTIFICACIONES REACTIVAS SSE */}
                  <div className="config-card">
                    <h4>5. Notificaciones Push y WebSockets</h4>
                    <p>Bus reactivo de eventos hacia clientes Web/Mobile via Server-Sent Events y WebSockets (.NET 8).</p>
                    <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Canal de difusion:</span>
                      <span className={`badge ${modoNotificaciones.deshabilitado ? 'badge-error' : 'badge-success'}`}>
                        {modoNotificaciones.deshabilitado ? 'DESHABILITADO (MODO SILENCIOSO)' : 'HABILITADO (STREAMING ACTIVO)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleToggleNotificacionesMode}
                        className={modoNotificaciones.deshabilitado ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                        style={!modoNotificaciones.deshabilitado ? { borderColor: '#ef4444', color: '#f87171' } : {}}
                      >
                        {modoNotificaciones.deshabilitado ? 'Habilitar Streaming SSE' : 'Deshabilitar Streaming SSE'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL DE AUDITORÍA OPERATIVA Y ALERTAS DEL SISTEMA */}
        {showAlertasModal && (
          <div className="modal-backdrop animate-fade-in" onClick={() => setShowAlertasModal(false)}>
            <div 
              className="profile-modal-card glass-panel" 
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-medium)', paddingBottom: '1rem' }}>
                <div className="modal-title-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={24} style={{ color: metrics?.alertasActivas > 0 ? '#ef4444' : '#10b981' }} />
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Centro de Auditoría Operativa y Alertas del Sistema</h2>
                  </div>
                  <p className="modal-subtitle" style={{ margin: '0.25rem 0 0 0' }}>
                    Diagnóstico de resiliencia, monitoreo de microservicios y estado de colas RabbitMQ / DLQ
                  </p>
                </div>
                <button 
                  onClick={() => setShowAlertasModal(false)}
                  className="btn-secondary btn-sm"
                  style={{ padding: '0.35rem 0.65rem' }}
                >
                  Cerrar
                </button>
              </div>

              {/* Resumen Bento de Estado */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', margin: '1.25rem 0' }}>
                <div className="glass-panel" style={{ padding: '0.85rem', borderLeft: '4px solid #ef4444' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Alertas Totales</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: metrics?.alertasActivas > 0 ? '#ef4444' : '#10b981' }}>
                    {metrics?.alertasActivas}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {metrics?.alertasActivas === 0 ? 'Sin incidencias activas' : 'Requiere atención operativa'}
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: '0.85rem', borderLeft: '4px solid #f59e0b' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Órdenes en Contingencia</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>
                    {metrics?.ultimasOrdenes?.filter(o => o.estado === 'PAGO_EN_CONTINGENCIA').length || pagosContingencia.length}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Retenidas en RabbitMQ DLQ</span>
                </div>

                <div className="glass-panel" style={{ padding: '0.85rem', borderLeft: '4px solid #3b82f6' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pasarela PayKlik</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: modoPayklik.deshabilitado ? '#ef4444' : '#10b981' }}>
                    {modoPayklik.deshabilitado ? 'Deshabilitada' : 'Operativa'}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {modoPayklik.deshabilitado ? 'Circuit Breaker Activo' : 'En línea (Normal)'}
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: '0.85rem', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Servicios Conectados</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>
                    {metrics?.sistemas?.filter(s => s.statusType !== 'error').length || 6} / {metrics?.sistemas?.length || 6}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Microservicios SGO-Logic</span>
                </div>
              </div>

              {/* Botones de acción directa */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={handleReprocesarDlq}
                  disabled={reprocesandoDlq || ((metrics?.ultimasOrdenes?.filter(o => o.estado === 'PAGO_EN_CONTINGENCIA').length || 0) === 0 && pagosContingencia.length === 0)}
                  className="btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#10b981', borderColor: '#10b981' }}
                >
                  <RefreshCw size={14} className={reprocesandoDlq ? 'spin-slow' : ''} />
                  <span>{reprocesandoDlq ? 'Drenando cola DLQ...' : 'Drenar y Reprocesar Contingencias DLQ'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderStatusFilter('PAGO_EN_CONTINGENCIA');
                    setActiveTab('pedidos');
                    setShowAlertasModal(false);
                  }}
                  className="btn-secondary btn-sm"
                >
                  Ver en Gestión de Pedidos
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('config');
                    setShowAlertasModal(false);
                  }}
                  className="btn-secondary btn-sm"
                >
                  Ir a Configuración de Resiliencia
                </button>
              </div>

              {/* Tabs internos */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-medium)', marginBottom: '1rem' }}>
                <button
                  className={`btn-sm ${alertasTab === 'contingencia' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAlertasTab('contingencia')}
                  style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
                >
                  Cola de Contingencia DLQ ({metrics?.ultimasOrdenes?.filter(o => o.estado === 'PAGO_EN_CONTINGENCIA').length || pagosContingencia.length})
                </button>
                <button
                  className={`btn-sm ${alertasTab === 'servicios' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAlertasTab('servicios')}
                  style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
                >
                  Salud de Microservicios ({metrics?.sistemas?.length || 6})
                </button>
                <button
                  className={`btn-sm ${alertasTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAlertasTab('logs')}
                  style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
                >
                  Logs y Auditoría del Sistema
                </button>
              </div>

              {/* Contenido Tab 1: Órdenes en contingencia */}
              {alertasTab === 'contingencia' && (
                <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  {(metrics?.ultimasOrdenes?.filter(o => o.estado === 'PAGO_EN_CONTINGENCIA').length === 0 && pagosContingencia.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={36} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>No hay órdenes retenidas en contingencia DLQ.</p>
                      <span style={{ fontSize: '0.85rem' }}>Todas las transacciones se encuentran conciliadas o en ruta logística nominal.</span>
                    </div>
                  ) : (
                    <table className="ops-table" style={{ width: '100%', fontSize: '0.85rem', minWidth: '550px' }}>
                      <thead>
                        <tr>
                          <th>ID Orden</th>
                          <th>Cliente</th>
                          <th>Total</th>
                          <th>Canal</th>
                          <th>Motivo / Diagnóstico</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(metrics?.ultimasOrdenes?.filter(o => o.estado === 'PAGO_EN_CONTINGENCIA') || []).map((ord) => (
                          <tr key={ord.id}>
                            <td className="font-mono text-orange">{ord.id}</td>
                            <td>{ord.cliente}</td>
                            <td className="font-mono">${Number(ord.total).toFixed(2)}</td>
                            <td>{ord.canal}</td>
                            <td>
                              <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                                PayKlik Fallo Simulado / DLQ
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => {
                                  setOrderSearch(ord.id);
                                  setOrderStatusFilter('TODOS');
                                  setActiveTab('pedidos');
                                  setShowAlertasModal(false);
                                }}
                                className="btn-secondary btn-sm"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                Inspeccionar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Contenido Tab 2: Salud de Microservicios */}
              {alertasTab === 'servicios' && (
                <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="ops-table" style={{ width: '100%', fontSize: '0.85rem', minWidth: '550px' }}>
                    <thead>
                      <tr>
                        <th>Microservicio</th>
                        <th>Estado Operativo</th>
                        <th>Latencia</th>
                        <th>Diagnóstico SGO-Logic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics?.sistemas?.map((sis, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{sis.nombre}</td>
                          <td>
                            <span className={`badge ${sis.statusType === 'error' ? 'badge-error' : 'badge-success'}`}>
                              {sis.estado}
                            </span>
                          </td>
                          <td className="font-mono">{sis.latencia}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {sis.statusType === 'error'
                              ? 'Servicio no responde o se encuentra deshabilitado para simulación de contingencia'
                              : 'Operación nominal verificada mediante health check HTTP'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Contenido Tab 3: Logs y Auditoría del Sistema */}
              {alertasTab === 'logs' && (
                <div style={{ maxHeight: '350px', overflowY: 'auto', background: '#0a0d14', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  <div style={{ marginBottom: '0.5rem', color: '#10b981', borderBottom: '1px solid #1e293b', paddingBottom: '0.4rem' }}>
                    --- LOGS DE EVENTOS Y RESILIENCIA SGO-LOGIC 2026 ---
                  </div>
                  {incidencias && incidencias.length > 0 ? (
                    incidencias.map((inc) => (
                      <div key={inc.id} style={{ marginBottom: '0.4rem', color: '#cbd5e1' }}>
                        <span style={{ color: '#94a3b8' }}>[{inc.fecha ? new Date(inc.fecha).toLocaleTimeString() : 'Reciente'}]</span>{' '}
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>[{inc.tipoEvento}]</span>{' '}
                        <span style={{ color: '#38bdf8' }}>Orden #{inc.ordenId}</span>: {inc.detalle}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#94a3b8' }}>No se han registrado incidentes de soporte adicionales.</div>
                  )}
                  {(metrics?.sistemas || []).map((sis, idx) => (
                    <div key={`sis-${idx}`} style={{ marginTop: '0.25rem', color: sis?.statusType === 'error' ? '#f87171' : '#64748b' }}>
                      <span>[HEALTH]</span> {sis?.nombre}: {sis?.estado} (latencia: {sis?.latencia})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL DE RESPUESTA A INCIDENCIA DE CLIENTE */}
        {ticketEnRespuesta && (
          <div className="modal-backdrop animate-fade-in" onClick={() => setTicketEnRespuesta(null)}>
            <div 
              className="profile-modal-card glass-panel" 
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '650px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-medium)', paddingBottom: '1rem' }}>
                <div className="modal-title-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={22} style={{ color: 'var(--accent-orange)' }} />
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Responder Incidencia TCK-{ticketEnRespuesta.id}</h2>
                  </div>
                  <p className="modal-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                    Orden: <strong className="font-mono text-orange">{ticketEnRespuesta.ordenId}</strong> | Tipo: <strong>{ticketEnRespuesta.tipoEvento?.replace('INCIDENCIA_', '').toUpperCase()}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => setTicketEnRespuesta(null)}
                  className="btn-secondary btn-sm"
                  style={{ padding: '0.35rem 0.65rem' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ margin: '1rem 0' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consulta / Reclamo del Cliente:</span>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {ticketEnRespuesta.detalle}
                  </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    Plantillas de Respuesta Rápida:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {[
                      'Tu solicitud ha sido recibida y nuestro equipo de logística está agilizando la entrega.',
                      'Hemos verificado tu pago y el comprobante ha sido actualizado en el sistema.',
                      'Tu reporte de garantía/devolución fue aprobado. Un agente se comunicará para la recolección.',
                      'El incidente ha sido resuelto satisfactoriamente. Tu orden continúa su curso normal.',
                      'Estamos gestionando la actualización de stock para procesar tu despacho de inmediato.'
                    ].map((plantilla, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTextoRespuesta(plantilla)}
                        className="btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', textAlign: 'left', borderRadius: '6px' }}
                      >
                        {plantilla.substring(0, 48)}...
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleEnviarRespuestaTicket}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Respuesta al Cliente:
                    </label>
                    <textarea
                      rows={4}
                      value={textoRespuesta}
                      onChange={(e) => setTextoRespuesta(e.target.value)}
                      placeholder="Escribe la respuesta que verá el cliente en su portal de seguimiento..."
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setTicketEnRespuesta(null)}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={enviandoRespuesta || !textoRespuesta.trim()}
                      className="btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem' }}
                    >
                      <Send size={15} />
                      {enviandoRespuesta ? 'Enviando...' : 'Enviar Respuesta'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

