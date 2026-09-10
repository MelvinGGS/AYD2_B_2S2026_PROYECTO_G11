import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Settings, RefreshCw,
  TrendingUp, AlertTriangle, Clock, CheckCircle2, MoreVertical, Store, LogOut,
  Search, Filter, ShieldCheck, Database, Layers, ArrowUpRight, CheckCircle, Truck, FileText
} from 'lucide-react';
import { getDashboardMetrics } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('TODOS');
  const { user, logout } = useAuth();

  const fetchMetrics = async () => {
    setLoading(true);
    const data = await getDashboardMetrics();
    setMetrics(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

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
    const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase()) || o.cliente.toLowerCase().includes(orderSearch.toLowerCase());
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
            className={`nav-item ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <Settings size={20} />
            <span>Configuración</span>
          </button>
        </nav>

        {/* User Footer */}
        <div className="sidebar-user-footer">
          <div className="user-info">
            <span className="user-name-label">{user?.nombre || 'Admin Operativo'}</span>
            <span className="user-email-sub">{user?.email || 'admin@megastore.com'}</span>
          </div>
          <button onClick={logout} className="icon-btn-logout" title="Cerrar sesión">
            <LogOut size={18} />
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
                                <td>{ord.cliente}</td>
                                <td>{getStatusBadge(ord.estado)}</td>
                                <td><span className="channel-tag">{ord.canal}</span></td>
                                <td className="font-bold">${ord.total.toFixed(2)}</td>
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
                      {mockInventario.map((item, idx) => (
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
                          <td>{new Date(ord.fecha).toLocaleDateString()}</td>
                          <td className="font-bold">{ord.cliente}</td>
                          <td><span className="channel-tag">{ord.canal}</span></td>
                          <td className="font-label-sm">{ord.metodoPago}</td>
                          <td>{getStatusBadge(ord.estado)}</td>
                          <td className="font-bold">${ord.total.toFixed(2)}</td>
                          <td className="text-right">
                            <Link to={`/seguimiento/${ord.id}`} className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                              Ver Tracking
                            </Link>
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
                      {mockClientes.map((cli) => (
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
                    <p>Frecuencia de generación y transmisión de archivos concilliados CSV/XML.</p>
                    <div className="config-field">
                      <label className="form-label">Intervalo en minutos:</label>
                      <input type="number" className="form-input" defaultValue={30} />
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
