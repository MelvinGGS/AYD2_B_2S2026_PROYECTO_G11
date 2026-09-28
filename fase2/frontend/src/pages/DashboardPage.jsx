import React, { useEffect, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Settings, RefreshCw,
  TrendingUp, AlertTriangle, Clock, CheckCircle2, MoreVertical, Store, LogOut,
  Search, Filter, ShieldCheck, Database, Layers, ArrowUpRight, CheckCircle, Truck, FileText, LifeBuoy
} from 'lucide-react';
import { getDashboardMetrics, getInventarioUnificado, getClientes, updateEstadoOrden, getIncidencias } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('TODOS');

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
    { sku: 'SKU-EPR-001', producto: 'Cafetera Espresso Serie X', cdNorte: 15, cdSur: 8, tiendas: 42, total: 65, estado: 'Óptimo' },
    { sku: 'SKU-REF-002', producto: 'Refrigerador Multi-Door 24 cu.ft', cdNorte: 2, cdSur: 1, tiendas: 5, total: 8, estado: 'Crítico' },
    { sku: 'SKU-ROB-003', producto: 'Robot Aspirador Laser LiDAR', cdNorte: 25, cdSur: 18, tiendas: 60, total: 103, estado: 'Óptimo' },
    { sku: 'SKU-SMA-004', producto: 'Smartwatch V3 Pro AMOLED', cdNorte: 40, cdSur: 32, tiendas: 110, total: 182, estado: 'Óptimo' },
    { sku: 'SKU-AUR-005', producto: 'Auriculares Noise Cancelling Pro', cdNorte: 10, cdSur: 5, tiendas: 18, total: 33, estado: 'Bajo' },
    { sku: 'SKU-OLED-006', producto: 'Smart TV OLED 4K 65"', cdNorte: 4, cdSur: 3, tiendas: 9, total: 16, estado: 'Bajo' }
  ];

  const defaultClientes = [
    { id: 'CLI-1', nombre: 'Carlos Aragon', email: 'cliente@megastore.com', canal: 'Web Store', ordenes: 1, totalGasto: 227.79, estado: 'Activo' },
    { id: 'CLI-2', nombre: 'Administrador Ops', email: 'admin@megastore.com', canal: 'Call Center', ordenes: 0, totalGasto: 0.00, estado: 'Activo' }
  ];

  const [inventario, setInventario] = useState(defaultInventario);
  const [clientes, setClientes] = useState(defaultClientes);
  const [incidencias, setIncidencias] = useState([]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [dataMetrics, dataInventario, dataClientes, dataIncidencias] = await Promise.all([
        getDashboardMetrics(),
        getInventarioUnificado(),
        getClientes(),
        getIncidencias()
      ]);
      setMetrics(dataMetrics);
      if (dataInventario && dataInventario.length > 0) {
        setInventario(dataInventario);
      }
      if (dataIncidencias && dataIncidencias.length > 0) {
        setIncidencias(dataIncidencias);
      }
      if (dataClientes && dataClientes.length > 0) {
        const enriched = dataClientes.map(c => ({
          ...c,
          ordenes: c.ordenes || 1,
          totalGasto: typeof c.totalGasto === 'number' ? c.totalGasto : 189.99
        }));
        setClientes(enriched);
      }
    } catch (e) {
      console.error('Error cargando datos del dashboard:', e);
    } finally {
      setLoading(false);
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
      default: return <span className="badge badge-warning">Procesando</span>;
    }
  };

  // Mock data for Inventario Unificado
  const mockInventario = [
    { sku: 'SKU-EPR-001', producto: 'Cafetera Espresso Serie X', cdNorte: 15, cdSur: 8, tiendas: 42, total: 65, estado: 'Óptimo' },
    { sku: 'SKU-REF-002', producto: 'Refrigerador Multi-Door 24 cu.ft', cdNorte: 2, cdSur: 1, tiendas: 5, total: 8, estado: 'Crítico' },
    { sku: 'SKU-ROB-003', producto: 'Robot Aspirador Laser LiDAR', cdNorte: 25, cdSur: 18, tiendas: 60, total: 103, estado: 'Óptimo' },
    { sku: 'SKU-SMA-004', producto: 'Smartwatch V3 Pro AMOLED', cdNorte: 40, cdSur: 32, tiendas: 110, total: 182, estado: 'Óptimo' },
    { sku: 'SKU-AUR-005', producto: 'Auriculares Noise Cancelling Pro', cdNorte: 10, cdSur: 5, tiendas: 18, total: 33, estado: 'Bajo' },
    { sku: 'SKU-OLED-006', producto: 'Smart TV OLED 4K 65"', cdNorte: 4, cdSur: 3, tiendas: 9, total: 16, estado: 'Bajo' }
  ];

  // Mock data for Clientes Omnicanal
  const mockClientes = [
    { id: 'CLI-101', nombre: 'Melvin García', email: 'melvin@example.com', canal: 'Web Store', ordenes: 8, totalGasto: 1840.50, estado: 'Activo' },
    { id: 'CLI-102', nombre: 'Carlos Mendoza', email: 'carlos.m@example.com', canal: 'App Móvil', ordenes: 5, totalGasto: 920.00, estado: 'Activo' },
    { id: 'CLI-103', nombre: 'Ana Lucía Gómez', email: 'ana.gomez@example.com', canal: 'Call Center', ordenes: 12, totalGasto: 3450.80, estado: 'VIP' },
    { id: 'CLI-104', nombre: 'Sofia Ramírez', email: 'sofia.r@example.com', canal: 'Tienda Física', ordenes: 3, totalGasto: 410.00, estado: 'Activo' },
    { id: 'CLI-105', nombre: 'Fernando Cabrera', email: 'fcabrera@example.com', canal: 'Web Store', ordenes: 1, totalGasto: 129.50, estado: 'Nuevo' }
  ];

  const filteredOrders = metrics?.ultimasOrdenes?.filter(o => {
    const oId = (o.id || '').toLowerCase();
    const oClient = (o.clienteNombre || o.cliente || '').toLowerCase();
    const s = orderSearch.toLowerCase();
    const matchesSearch = oId.includes(s) || oClient.includes(s);
    const matchesFilter = orderStatusFilter === 'TODOS' || o.estado === orderStatusFilter;
    return matchesSearch && matchesFilter;
  }) || [];

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
        {/* Header Bar */}
        <header className="dashboard-header">
          <div>
            <h1 className="header-title">
              {activeTab === 'dashboard' && 'Dashboard Operativo'}
              {activeTab === 'inventario' && 'Inventario Unificado (32 Tiendas + 2 CD)'}
              {activeTab === 'pedidos' && 'Gestión de Pedidos Omnicanal'}
              {activeTab === 'clientes' && 'Directorio de Clientes Omnicanal'}
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
                {/* Bento Metrics Cards Grid */}
                <section className="bento-metrics-grid">
                  <div className="metric-card glass-panel">
                    <div className="metric-header">
                      <span>Órdenes Hoy</span>
                      <ShoppingBag size={20} className="icon-orange" />
                    </div>
                    <div className="metric-value">{metrics?.totalOrdenesHoy.toLocaleString()}</div>
                    <div className="metric-footer text-success">
                      <TrendingUp size={14} />
                      <span>{metrics?.ordenesIncremento}</span>
                    </div>
                  </div>

                  <div className="metric-card glass-panel">
                    <div className="metric-header">
                      <span>Pendientes por despachar</span>
                      <Clock size={20} className="icon-orange" />
                    </div>
                    <div className="metric-value">{metrics?.ordenesPendientes}</div>
                    <div className="metric-footer text-warning">
                      <span>Requiere atención inmediata</span>
                    </div>
                  </div>

                  <div className="metric-card glass-panel border-alert">
                    <div className="metric-header text-error">
                      <span>Alertas de Servicio</span>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="metric-value text-error">{metrics?.alertasActivas}</div>
                    <div className="metric-footer text-error">
                      <span>SAT latencia elevada</span>
                    </div>
                  </div>

                  <div className="metric-card glass-panel">
                    <div className="metric-header">
                      <span>Ingresos Hoy</span>
                      <TrendingUp size={20} className="icon-orange" />
                    </div>
                    <div className="metric-value">{metrics?.ingresosHoy}</div>
                    <div className="metric-footer text-success">
                      <span>+8.4% vs meta diaria</span>
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
                              <span className={`badge ${sys.statusType === 'success' ? 'badge-success' : 'badge-warning'}`}>
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
                        <div className="critical-item">
                          <div>
                            <span className="sku-code">SKU-A892</span>
                            <span className="sku-name">Refrigerador Multi-Door</span>
                          </div>
                          <span className="stock-alert-tag text-error">3 unidades</span>
                        </div>
                        <div className="critical-item">
                          <div>
                            <span className="sku-code">SKU-C114</span>
                            <span className="sku-name">Smart TV OLED 65"</span>
                          </div>
                          <span className="stock-alert-tag text-warning">7 unidades</span>
                        </div>
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
                    className="form-input"
                    style={{ width: '200px' }}
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                  >
                    <option value="TODOS">Todos los estados</option>
                    <option value="CREADA">Creada</option>
                    <option value="PAGADA">Pagada</option>
                    <option value="EN_PREPARACION">En Preparación</option>
                    <option value="EN_TRANSITO">En Tránsito</option>
                    <option value="ENTREGADA">Entregada</option>
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
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td className="font-mono text-orange">{ord.id}</td>
                          <td>{new Date(ord.fechaCreacion || ord.fecha || Date.now()).toLocaleDateString()}</td>
                          <td className="font-bold">{ord.clienteNombre || ord.cliente || 'Cliente Omnicanal'}</td>
                          <td><span className="channel-tag">{ord.canal || 'Web Store'}</span></td>
                          <td className="font-label-sm">{ord.metodoPago || 'PayKlik'}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              {getStatusBadge(ord.estado)}
                              <select
                                value={ord.estado}
                                onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                                className="form-input"
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: 'auto', background: 'var(--bg-card-solid)' }}
                                title="Actualizar estado operativo"
                              >
                                <option value="CREADA">Cambiar: Creada</option>
                                <option value="PAGADA">Cambiar: Pagada</option>
                                <option value="FACTURADA">Cambiar: Facturada</option>
                                <option value="EN_PREPARACION">Cambiar: En preparación</option>
                                <option value="EN_TRANSITO">Cambiar: En tránsito</option>
                                <option value="ENTREGADA">Cambiar: Entregada</option>
                              </select>
                            </div>
                          </td>
                          <td className="font-bold">${(Number(ord.total) || 0).toFixed(2)}</td>
                          <td className="text-right">
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <Link to={`/seguimiento/${ord.id}`} className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                                Ver Tracking
                              </Link>
                              <a
                                href={`http://localhost:8084/api/facturas/orden/${ord.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-secondary btn-sm"
                                style={{ textDecoration: 'none', color: 'var(--orange-primary)' }}
                                title="Descargar comprobante fiscal SAT FEL XML"
                              >
                                Factura XML
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
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
                    <p>Historial y comportamiento del cliente en todos los canales comerciales.</p>
                  </div>
                  <span className="badge badge-info">5 Clientes Registrados</span>
                </div>

                <div className="table-responsive">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>ID Cliente</th>
                        <th>Nombre</th>
                        <th>Correo electrónico</th>
                        <th>Canal Preferido</th>
                        <th>Órdenes</th>
                        <th>Total Invertido</th>
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
                          <td className="font-bold text-orange">${cli.totalGasto.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${cli.estado === 'VIP' ? 'badge-orange' : cli.estado === 'Nuevo' ? 'badge-info' : 'badge-success'}`}>
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
                  <span className="badge badge-warning">{incidencias.length} Registradas</span>
                </div>

                <div className="table-responsive">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>ID Ticket</th>
                        <th>Orden Asociada</th>
                        <th>Fecha</th>
                        <th>Tipo de Incidencia</th>
                        <th>Detalle del Cliente</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidencias.length === 0 ? (
                        <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No hay incidencias reportadas.</td></tr>
                      ) : (
                        incidencias.map((inc) => (
                          <tr key={inc.id}>
                            <td className="font-mono text-orange">TCK-{inc.id}</td>
                            <td className="font-mono">{inc.ordenId}</td>
                            <td>{new Date(inc.fecha).toLocaleString()}</td>
                            <td><span className="badge badge-warning">{inc.tipoEvento?.replace('INCIDENCIA_', '')}</span></td>
                            <td style={{maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={inc.detalle}>{inc.detalle}</td>
                            <td>
                              <Link to={`/seguimiento/${inc.ordenId}`} className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>Ver Orden</Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: CONFIGURACIÓN */}
            {activeTab === 'config' && (
              <div className="tab-pane-container glass-panel">
                <div className="tab-pane-header">
                  <div>
                    <h2>Parámetros y Restricciones SGO-Logic</h2>
                    <p>Ajustes técnicos de resiliencia, temporizadores y conectores legacy.</p>
                  </div>
                </div>

                <div className="config-grid">
                  <div className="config-card">
                    <h4>Temporizador de Reserva Stock</h4>
                    <p>Tiempo de bloqueo automático de unidades al iniciar checkout para prevenir sobreventas.</p>
                    <div className="config-field">
                      <label className="form-label">Minutos de reserva:</label>
                      <input type="number" className="form-input" defaultValue={15} />
                    </div>
                  </div>

                  <div className="config-card">
                    <h4>Sincronizador AS/400 (ERP Legacy)</h4>
                    <p>Frecuencia de generación y transmisión de archivos conciliados CSV/XML (Restricción RC-01 / ADR-005).</p>
                    <div className="config-field">
                      <label className="form-label">Intervalo en minutos:</label>
                      <input type="number" className="form-input" defaultValue={30} />
                    </div>
                    <div style={{ marginTop: '0.85rem' }}>
                      <a
                        href="http://localhost:8084/api/facturas/as400/ultimo-csv"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                        title="Descargar último archivo CSV conciliado para el ERP AS/400"
                      >
                        <FileText size={14} className="icon-orange" />
                        <span>Descargar Último Lote AS/400 (.csv)</span>
                      </a>
                    </div>
                  </div>

                  <div className="config-card">
                    <h4>Pasarela PayKlik Resiliencia</h4>
                    <p>Umbral de latencia para desviar solicitudes a la cola desacoplada (Outbox pattern).</p>
                    <div className="config-field">
                      <label className="form-label">Timeout máximo (segundos):</label>
                      <input type="number" className="form-input" defaultValue={5} />
                    </div>
                  </div>

                  <div className="config-card">
                    <h4>Conector SAT Facturación XML</h4>
                    <p>Modo asíncrono de reintentos en caso de caídas o latencias en la SAT.</p>
                    <div className="config-field">
                      <label className="checkbox-label">
                        <input type="checkbox" defaultChecked />
                        <span>Activar desacople de facturación asíncrona</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
};
