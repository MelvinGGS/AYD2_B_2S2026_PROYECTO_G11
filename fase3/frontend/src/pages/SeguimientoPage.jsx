import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Truck, HelpCircle, Package, ArrowLeft, ShieldCheck, MapPin, Clock, X, FileText } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { OrderTimeline } from '../components/OrderTimeline';
import { Footer } from '../components/Footer';
import { getOrden, getOrdenes, registrarIncidenciaCliente } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SeguimientoPage = () => {
  const { ordenId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orden, setOrden] = useState(null);
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      try {
        const allOrders = await getOrdenes();
        let displayList = [];
        if (user) {
          if (user.role === 'admin') {
            displayList = allOrders || [];
          } else if (user.nombre) {
            displayList = (allOrders || []).filter(
              o => (o.clienteNombre && o.clienteNombre.toLowerCase() === user.nombre.toLowerCase()) ||
                   (o.cliente && o.cliente.toLowerCase() === user.nombre.toLowerCase()) ||
                   (o.clienteId && String(o.clienteId) === String(user.id))
            );
          }
        }
        setOrdersList(displayList);

        let targetId = ordenId;
        if (!targetId) {
          targetId = localStorage.getItem('lastOrder');
        }
        if (!targetId && displayList.length > 0) {
          targetId = displayList[0].id;
        }

        if (targetId) {
          const data = await getOrden(targetId);
          setOrden(data);
        } else {
          setOrden(null);
        }
      } catch (err) {
        console.warn('No se pudo cargar la orden:', err);
        setOrden(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderData();
  }, [ordenId, user]);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [incidentType, setIncidentType] = useState('demora');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentSent, setIncidentSent] = useState(false);

  // Live polling: refreshes order status automatically without page reload
  useEffect(() => {
    if (!orden?.id || orden.estado === 'ENTREGADA') return;
    const interval = setInterval(async () => {
      try {
        const fresh = await getOrden(orden.id);
        if (fresh && fresh.estado !== orden.estado) {
          setOrden(fresh);
        }
      } catch (e) {
        // silent background poll
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [orden?.id, orden?.estado]);

  const handleSendIncident = async (e) => {
    e.preventDefault();
    if (orden?.id) {
      await registrarIncidenciaCliente(orden.id, incidentType, incidentNote);
    }
    setIncidentSent(true);
    setTimeout(() => {
      setIncidentSent(false);
      setShowHelpModal(false);
      setIncidentNote('');
    }, 2200);
  };

  const handleSearchOrder = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/seguimiento/${encodeURIComponent(searchId.trim())}`);
    }
  };

  const handleSelectOrder = (id) => {
    navigate(`/seguimiento/${encodeURIComponent(id)}`);
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content seguimiento-layout animate-fade-in">
        {/* Top Header & Search Bar */}
        <div className="seguimiento-header">
          <div className="header-text-group">
            <h1 className="page-title">Seguimiento de Pedido</h1>
            <p className="page-subtitle">Rastreo omnicanal en tiempo real integrado con LogiExpress</p>
          </div>

          <form onSubmit={handleSearchOrder} className="tracking-search-form">
            <div className="input-icon-wrapper">
              <Search size={18} className="field-icon" />
              <input
                type="text"
                className="form-input with-icon"
                placeholder="Buscar por ID de orden (Ej. ORD-2026-65381)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary btn-sm">Buscar</button>
          </form>
        </div>

        {/* Guest prompt to login */}
        {!user && (
          <div className="status-banner-card" style={{ marginBottom: '0.5rem' }}>
            <ShieldCheck size={20} className="icon-orange" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>Inicia sesión para visualizar y gestionar tu historial completo de compras.</span>
              <button onClick={() => navigate('/login?redirect=/seguimiento')} className="btn-secondary btn-sm">
                Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {/* Orders Selector / History List */}
        {ordersList.length > 0 && (
          <div className="orders-history-panel glass-panel">
            <div className="orders-history-header">
              <div className="orders-history-title">
                <Package size={18} className="icon-orange" />
                <span>Historial de Pedidos ({ordersList.length})</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Selecciona una orden para ver su estado y detalles
              </span>
            </div>

            <div className="orders-chips-grid">
              {ordersList.map((ord) => {
                const isSelected = orden?.id === ord.id;
                return (
                  <div
                    key={ord.id}
                    className={`order-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectOrder(ord.id)}
                  >
                    <div className="order-chip-top">
                      <span className="order-chip-id">{ord.id}</span>
                      <span className={`badge ${
                        ord.estado === 'ENTREGADA' ? 'badge-success' :
                        ord.estado === 'EN_TRANSITO' ? 'badge-info' :
                        ord.estado === 'EN_PREPARACION' ? 'badge-orange' :
                        ord.estado === 'FACTURADA' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {ord.estado}
                      </span>
                    </div>
                    <div className="order-chip-bottom">
                      <span>{new Date(ord.fechaCreacion || ord.fecha || Date.now()).toLocaleDateString()}</span>
                      <span className="order-chip-total">${(Number(ord.total) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-container glass-panel">
            <div className="spinner"></div>
            <p>Consultando estado en bus de eventos Omnicanal...</p>
          </div>
        ) : !orden ? (
          <div className="empty-results glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <Package size={52} style={{ color: 'var(--orange-primary)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '0.6rem', fontWeight: 700 }}>
              {ordenId ? `No se encontró la orden "${ordenId}"` : 'No hay pedidos activos'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Verifica el identificador de orden o ingresa uno en el buscador superior. También puedes crear un pedido desde el catálogo.
            </p>
            <button onClick={() => navigate('/catalogo')} className="btn-primary">
              Ir al Catálogo de Productos
            </button>
          </div>
        ) : (
          <div className="seguimiento-main-grid">
            {/* Tracking Code Banner Card */}
            <div className="tracking-code-card glass-panel">
              <div className="tracking-info">
                <span className="tracking-label">Código de Rastreo LogiExpress</span>
                <span className="tracking-code">{orden.codigoRastreo || 'LEX-849204-GT'}</span>
              </div>
              <button 
                className="btn-secondary btn-help"
                onClick={() => setShowHelpModal(true)}
              >
                <HelpCircle size={16} />
                <span>¿Necesitas ayuda?</span>
              </button>
            </div>

            {/* Timeline Panel */}
            <div className="timeline-panel glass-panel">
              <h3 className="panel-title">Estado de Transmisión</h3>
              <OrderTimeline timeline={orden.timeline} />
            </div>

            {/* Order Details Drawer Card */}
            <div className="order-details-card glass-panel">
              <h3 className="panel-title">Detalles de la Orden ({orden.id})</h3>

              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Cliente</span>
                  <span className="detail-val">{orden.clienteNombre || orden.cliente || 'Cliente Omnicanal'}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Canal de origen</span>
                  <span className="detail-val badge badge-info">{orden.canal || 'Web Store'}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Dirección de entrega</span>
                  <span className="detail-val flex-center-gap">
                    <MapPin size={14} className="icon-orange" />
                    {orden.direccion || 'Ciudad de Guatemala'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Método de pago</span>
                  <span className="detail-val">{orden.metodoPago || 'Transferencia bancaria'}</span>
                </div>
              </div>

              {/* Items summary snapshot */}
              <div className="items-snapshot">
                <h4 className="snapshot-title">Contenido del paquete ({orden.items?.length || 0})</h4>
                <div className="snapshot-list">
                  {orden.items?.map((item, idx) => {
                    const itemName = item.nombreProducto || item.nombre || 'Producto MegaStore';
                    const unitPrice = Number(item.precioUnitario != null ? item.precioUnitario : item.precio) || 0;
                    const qty = Number(item.cantidad) || 1;
                    const subtotal = Number(item.subtotal) || +(unitPrice * qty).toFixed(2);
                    return (
                      <div key={idx} className="snapshot-row">
                        <span className="snapshot-name">• {itemName}</span>
                        <span className="snapshot-qty">x{qty}</span>
                        <span className="snapshot-price">${subtotal.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SAT DTE Fiscal Invoice Section */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>Facturación Electrónica SAT (FEL)</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Documento Tributario Electrónico emitido con firma digital</span>
                </div>
                <a
                  href={`http://localhost:8084/api/facturas/orden/${orden.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary btn-sm"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--orange-primary)' }}
                  title="Descargar comprobante tributario oficial SAT FEL en formato XML"
                >
                  <FileText size={15} />
                  <span>Descargar Factura XML</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Centro de Ayuda y Gestion de Incidencias */}
      {showHelpModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setShowHelpModal(false)}>
          <div className="profile-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="icon-badge">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3>Centro de Ayuda y Soporte Omnicanal</h3>
                  <p className="modal-subtitle">Asistencia para la orden #{orden?.id || 'Actual'}</p>
                </div>
              </div>
              <button className="icon-btn-sm" onClick={() => setShowHelpModal(false)} title="Cerrar">
                <X size={18} />
              </button>
            </div>

            {incidentSent ? (
              <div className="status-banner-card text-success" style={{ margin: '1.5rem 0', textAlign: 'center' }}>
                <ShieldCheck size={24} style={{ margin: '0 auto 0.5rem' }} />
                <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Incidencia Registrada</h4>
                <p style={{ fontSize: '0.9rem' }}>Tu solicitud ha sido remitida al Call Center. Te contactaremos en breve.</p>
              </div>
            ) : (
              <div className="help-content-wrapper">
                <div className="support-channels-grid">
                  <div className="support-channel-box">
                    <span className="channel-title">Call Center 24/7</span>
                    <span className="channel-val">+502 2400-0000 (Ext. 2)</span>
                    <span className="channel-hint">Atención telefónica directa</span>
                  </div>
                  <div className="support-channel-box">
                    <span className="channel-title">WhatsApp Omnicanal</span>
                    <span className="channel-val">+502 5555-7465</span>
                    <span className="channel-hint">Respuesta en menos de 5 min</span>
                  </div>
                  <div className="support-channel-box">
                    <span className="channel-title">Correo Electrónico</span>
                    <span className="channel-val">soporte@megastore.com</span>
                    <span className="channel-hint">Casos especiales y devoluciones</span>
                  </div>
                </div>

                <form onSubmit={handleSendIncident} className="incident-form">
                  <h4 className="section-title">Reportar Incidencia o Cambio en la Orden</h4>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Tipo de Requerimiento</label>
                    <select
                      className="form-input"
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                    >
                      <option value="demora">Demora en entrega estimada</option>
                      <option value="direccion">Corrección de dirección de entrega</option>
                      <option value="producto">Cambio o devolución de producto</option>
                      <option value="pago">Aclaración de cargo PayKlik</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Detalles del Requerimiento</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Describe la consulta o cambio solicitado para coordinar con LogiExpress..."
                      value={incidentNote}
                      onChange={(e) => setIncidentNote(e.target.value)}
                      required
                    />
                  </div>

                  <div className="modal-actions-row">
                    <button type="submit" className="btn-primary">
                      Enviar Incidencia al Soporte
                    </button>
                    <button type="button" onClick={() => setShowHelpModal(false)} className="btn-secondary">
                      Cerrar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
