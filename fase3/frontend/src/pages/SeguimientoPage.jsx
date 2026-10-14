import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Search, Truck, HelpCircle, Package, ArrowLeft, ShieldCheck, MapPin, Clock, X, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { OrderTimeline } from '../components/OrderTimeline';
import { Footer } from '../components/Footer';
import {
  getOrden,
  getOrdenes,
  registrarIncidenciaCliente,
  cancelarOrdenCliente,
  abonarCreditoCliente,
  obtenerHistorialPagoOrden,
  getEstadoCreditoCliente,
  reprocesarPagosContingencia,
  getIncidenciasOrden,
  FACTURACION_API
} from '../services/api';
import { esMetodoCreditoPropio } from '../utils/checkoutUtils';
import { useAuth } from '../context/AuthContext';

export const SeguimientoPage = () => {
  const { ordenId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login?redirect=/seguimiento" replace />;
  }

  const [orden, setOrden] = useState(null);
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [pagoStatus, setPagoStatus] = useState({ online: true, intentos: [] });
  const [ordenesLiquidadas, setOrdenesLiquidadas] = useState([]);

  const [orderError, setOrderError] = useState('');
  const [reintentandoPago, setReintentandoPago] = useState(false);
  const [reintentoMsg, setReintentoMsg] = useState('');
  const [helpTab, setHelpTab] = useState('registrar'); // 'registrar' | 'historial'
  const [historialIncidencias, setHistorialIncidencias] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const refreshPaymentAndCredit = async (ordObj) => {
    if (!ordObj?.id) return;
    try {
      const [hist, cred] = await Promise.all([
        obtenerHistorialPagoOrden(ordObj.id),
        getEstadoCreditoCliente(ordObj.clienteId || user?.id || '1')
      ]);
      setPagoStatus(hist);
      if (cred && Array.isArray(cred.ordenesLiquidadas)) {
        setOrdenesLiquidadas(cred.ordenesLiquidadas);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      setOrderError('');
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
          if (data) {
            await refreshPaymentAndCredit(data);
          }
        } else {
          setOrden(null);
        }
      } catch (err) {
        console.warn('No se pudo cargar la orden:', err);
        setOrderError(err.message || 'El servicio de órdenes no se encuentra disponible.');
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
  const [isLiveReactive, setIsLiveReactive] = useState(false);
  const [liveNotification, setLiveNotification] = useState(null);

  // Conexión reactiva en tiempo real (WebSockets / SSE) con notificaciones-service (:8086)
  useEffect(() => {
    if (!orden?.id || orden.estado === 'ENTREGADA') return;

    let ws = null;
    let eventSource = null;
    let isConnected = false;

    try {
      // Intento primario: WebSockets nativos reactivos
      const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
      const isProdOrHost = typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const notifHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
      const wsUrl = (isHttps || isProdOrHost)
        ? `${wsProtocol}//${window.location.host}/ws/tracking/${encodeURIComponent(orden.id)}`
        : `ws://${notifHost}:8086/ws/tracking/${encodeURIComponent(orden.id)}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsLiveReactive(true);
        isConnected = true;
        console.log('[PUSH REACTIVO] WebSocket conectado para orden:', orden.id);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[PUSH REACTIVO] Evento recibido vía WebSocket:', data);
          setLiveNotification(data);
          // Refrescar orden instantáneamente sin esperar polling
          const fresh = await getOrden(orden.id);
          if (fresh) {
            setOrden(fresh);
            await refreshPaymentAndCredit(fresh);
          }
        } catch (err) {
          console.warn('Error parseando mensaje WebSocket:', err);
        }
      };

      ws.onerror = () => {
        // Fallback a Server-Sent Events (SSE) si WebSocket falla
        if (!isConnected && typeof EventSource !== 'undefined') {
          console.log('[PUSH REACTIVO] Activando fallback reactivo SSE...');
          const sseUrl = (isHttps || isProdOrHost)
            ? `${window.location.origin}/api/notificaciones/stream/${encodeURIComponent(orden.id)}`
            : `http://${notifHost}:8086/api/notificaciones/stream/${encodeURIComponent(orden.id)}`;
          eventSource = new EventSource(sseUrl);
          eventSource.onopen = () => setIsLiveReactive(true);
          eventSource.onmessage = async (e) => {
            try {
              const data = JSON.parse(e.data);
              setLiveNotification(data);
              const fresh = await getOrden(orden.id);
              if (fresh) {
                setOrden(fresh);
                await refreshPaymentAndCredit(fresh);
              }
            } catch (err) { }
          };
        }
      };
    } catch (e) {
      console.warn('WebSockets no soportado o error:', e);
    }

    // Polling de respaldo y monitoreo de recuperación de contingencia
    const interval = setInterval(async () => {
      try {
        const fresh = await getOrden(orden.id);
        if (fresh) {
          setOrden(fresh);
          await refreshPaymentAndCredit(fresh);
        }
      } catch (e) { }
    }, 4000);

    return () => {
      if (ws) ws.close();
      if (eventSource) eventSource.close();
      clearInterval(interval);
      setIsLiveReactive(false);
    };
  }, [orden?.id, orden?.estado]);

  const fetchIncidenciasOrden = async (ordId) => {
    if (!ordId) return;
    setCargandoHistorial(true);
    try {
      const incs = await getIncidenciasOrden(ordId);
      setHistorialIncidencias(incs);
    } catch (e) {
      console.warn('Error al cargar historial de incidencias:', e);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleOpenHelpModal = () => {
    window.dispatchEvent(new CustomEvent('open-help-modal', { detail: { ordenId: orden?.id } }));
  };

  const handleReintentarPagoCliente = async () => {
    if (!orden?.id) return;
    setReintentandoPago(true);
    setReintentoMsg('');
    try {
      const res = await reprocesarPagosContingencia();
      setReintentoMsg(`Reintento ejecutado: ${res.reprocesados || 0} pago(s) procesado(s). Verificando confirmación...`);
      setTimeout(async () => {
        const fresh = await getOrden(orden.id);
        if (fresh) {
          setOrden(fresh);
          await refreshPaymentAndCredit(fresh);
        }
        setReintentandoPago(false);
      }, 1500);
    } catch (err) {
      setReintentoMsg(`Pasarela aún en contingencia: ${err.message}. Tu reserva de inventario permanece protegida.`);
      setReintentandoPago(false);
    }
  };

  const handleSendIncident = async (e) => {
    e.preventDefault();
    if (orden?.id) {
      await registrarIncidenciaCliente(orden.id, incidentType, incidentNote);
      await fetchIncidenciasOrden(orden.id);
    }
    setIncidentSent(true);
    setTimeout(() => {
      setIncidentSent(false);
      setIncidentNote('');
      setHelpTab('historial');
    }, 1800);
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
                      <span className={`badge ${ord.estado === 'ENTREGADA' ? 'badge-success' :
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
            {orderError ? (
              <AlertTriangle size={52} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
            ) : (
              <Package size={52} style={{ color: 'var(--orange-primary)', margin: '0 auto 1rem' }} />
            )}
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '0.6rem', fontWeight: 700 }}>
              {orderError ? 'Servicio no disponible' : (ordenId ? `No se encontró la orden "${ordenId}"` : 'No hay pedidos activos')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              {orderError || 'Verifica el identificador de orden o ingresa uno en el buscador superior. También puedes crear un pedido desde el catálogo.'}
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
                onClick={handleOpenHelpModal}
              >
                <HelpCircle size={16} />
                <span>¿Necesitas ayuda?</span>
              </button>
            </div>

            {/* Timeline Panel */}
            <div className="timeline-panel glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 className="panel-title" style={{ margin: 0 }}>Estado del Pedido</h3>
                {isLiveReactive ? (
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                    Actualización en tiempo real
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Actualizado</span>
                )}
              </div>

              {liveNotification && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem'
                }}>
                  <strong style={{ color: '#60a5fa' }}>{liveNotification.titulo || 'Evento en Vivo'}:</strong> {liveNotification.mensaje}
                </div>
              )}

              {(!pagoStatus.online || orden.estado === 'PAGO_EN_CONTINGENCIA' || (pagoStatus.intentos?.length > 0 && pagoStatus.intentos[pagoStatus.intentos.length - 1].resultado === 'ENCOLADO_CONTINGENCIA')) && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.84rem',
                  color: '#fde68a',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '3px' }}>
                      Procesamiento de Pago en Curso (Contingencia DLQ)
                    </strong>
                    <span>
                      Tu orden y productos están reservados temporalmente (bloqueo de 15 min). La confirmación del pago se completará automáticamente en breve o puedes reintentar el procesamiento.
                    </span>
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleReintentarPagoCliente}
                        disabled={reintentandoPago}
                        className="btn-primary btn-sm"
                        style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                      >
                        {reintentandoPago ? 'Reintentando cobro...' : 'Reintentar Pago Ahora'}
                      </button>
                      {reintentoMsg && (
                        <span style={{ fontSize: '0.78rem', color: '#fde68a' }}>{reintentoMsg}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                  <span className="detail-val">
                    {esMetodoCreditoPropio(orden.metodoPago)
                      ? 'Crédito Propio (Paga en 30 días)'
                      : (orden.metodoPago || 'Transferencia bancaria')}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Estado del pago</span>
                  <span className="detail-val" style={{ fontWeight: 600, color: '#34d399' }}>
                    {esMetodoCreditoPropio(orden.metodoPago)
                      ? 'Aprobado (Crédito Propio 30 Días)'
                      : (orden.estado === 'CANCELADA'
                        ? 'Cancelado'
                        : (!pagoStatus.online || orden.estado === 'PAGO_EN_CONTINGENCIA'
                          ? 'En proceso de confirmación'
                          : (pagoStatus.intentos?.length > 0
                            ? (pagoStatus.intentos[pagoStatus.intentos.length - 1].resultado === 'ENCOLADO_CONTINGENCIA'
                              ? 'En proceso de confirmación'
                              : 'Pago Autorizado')
                            : (orden.estado !== 'CREADA' ? 'Pago Autorizado' : 'En proceso de confirmación'))))}
                  </span>
                </div>

                {esMetodoCreditoPropio(orden.metodoPago) && (
                  <div className="detail-item">
                    <span className="detail-label">Vencimiento del crédito</span>
                    <span className="detail-val font-bold" style={{ color: 'var(--orange-primary)' }}>
                      {(() => {
                        const d = new Date(orden.fechaCreacion || orden.fecha || Date.now());
                        d.setDate(d.getDate() + 30);
                        return d.toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' });
                      })()} (0% recargo)
                    </span>
                  </div>
                )}
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

              {/* SAT DTE Fiscal Invoice & Acciones de Orden (BNPL / Cancelacion) */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>Facturación Electrónica SAT (FEL)</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {esMetodoCreditoPropio(orden.metodoPago) && orden.estado !== 'CANCELADA' && (
                    ordenesLiquidadas.includes(orden.id) ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.35rem 0.7rem' }}>
                        <CheckCircle2 size={14} /> Crédito 30d Liquidado
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={async () => {
                          try {
                            const res = await abonarCreditoCliente(orden.clienteId || user?.id || '1', orden.total || 0, orden.id);
                            setOrdenesLiquidadas(prev => [...prev, orden.id]);
                            setLiveNotification({
                              titulo: 'Abono a Crédito Propio Registrado',
                              mensaje: `${res?.mensaje || 'Pago aplicado exitosamente'} por Q${(Number(orden.total) || 0).toFixed(2)}. Tu cupo de crédito ha sido liberado.`
                            });
                          } catch (err) {
                            setLiveNotification({
                              titulo: 'Aviso de Crédito Propio',
                              mensaje: err.message || 'Esta orden ya fue liquidada previamente.'
                            });
                          }
                        }}
                        style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.35)' }}
                        title="Liquidar saldo de esta orden financiada a 30 días"
                      >
                        <span>Liquidar Crédito 30d</span>
                      </button>
                    )
                  )}
                  {(orden.estado === 'CREADA' || orden.estado === 'EN_PREPARACION' || orden.estado === 'PAGO_EN_CONTINGENCIA') && (
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={async () => {
                        const actualizada = await cancelarOrdenCliente(orden.id);
                        if (actualizada) setOrden(actualizada);
                        setLiveNotification({
                          titulo: 'Orden Cancelada',
                          mensaje: `La orden ${orden.id} ha sido cancelada y el stock reservado fue liberado.`
                        });
                      }}
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                      title="Cancelar pedido y liberar reserva de inventario"
                    >
                      <span>Cancelar Orden</span>
                    </button>
                  )}
                  {['FACTURADA', 'EN_PREPARACION', 'EN_TRANSITO', 'ENTREGADA', 'PAGADA'].includes(orden.estado) ? (
                    <a
                      href={`${FACTURACION_API}/orden/${orden.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary btn-sm"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--orange-primary)' }}
                      title="Descargar comprobante tributario oficial SAT FEL en formato XML"
                    >
                      <FileText size={15} />
                      <span>Descargar Factura XML</span>
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} style={{ opacity: 0.5 }} />
                      <span>{orden.estado === 'INVENTARIO_INSUFICIENTE' || orden.estado === 'CANCELADA' ? 'Sin factura fiscal (orden cancelada)' : 'Factura SAT en emisión'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal delegado al widget global GlobalHelpWidget */}
      {false && (
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

            {/* Sub-tabs: Registrar Atención vs Consultar Historial */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', margin: '1rem 0 1.25rem' }}>
              <button
                type="button"
                onClick={() => setHelpTab('registrar')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: helpTab === 'registrar' ? '2px solid var(--orange-primary)' : '2px solid transparent',
                  color: helpTab === 'registrar' ? 'var(--orange-primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                Registrar Atención
              </button>
              <button
                type="button"
                onClick={() => { setHelpTab('historial'); if (orden?.id) fetchIncidenciasOrden(orden.id); }}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: helpTab === 'historial' ? '2px solid var(--orange-primary)' : '2px solid transparent',
                  color: helpTab === 'historial' ? 'var(--orange-primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                Consultar Historial {historialIncidencias.length > 0 ? `(${historialIncidencias.length})` : ''}
              </button>
            </div>

            {helpTab === 'historial' ? (
              <div className="help-history-wrapper">
                <h4 className="section-title" style={{ marginBottom: '0.75rem' }}>
                  Historial de Requerimientos y Quejas Registradas
                </h4>
                {cargandoHistorial ? (
                  <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                    Consultando incidencias asociadas a la orden...
                  </p>
                ) : historialIncidencias.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                    <p style={{ marginBottom: '0.8rem' }}>No hay incidencias ni reportes registrados para esta orden.</p>
                    <button
                      type="button"
                      onClick={() => setHelpTab('registrar')}
                      className="btn-secondary btn-sm"
                    >
                      Registrar atención ahora
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                    {historialIncidencias.map((inc) => (
                      <div
                        key={inc.id}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          padding: '10px 14px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span className="font-mono text-orange" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            TCK-{inc.id}
                          </span>
                          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                            REGISTRADA
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                          {inc.tipoEvento?.replace('INCIDENCIA_', '').toUpperCase()}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.4 }}>
                          {inc.detalle}
                        </p>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          Fecha: {new Date(inc.fecha).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
                  <button type="button" onClick={() => setShowHelpModal(false)} className="btn-secondary">
                    Cerrar
                  </button>
                </div>
              </div>
            ) : incidentSent ? (
              <div className="status-banner-card text-success" style={{ margin: '1.5rem 0', textAlign: 'center' }}>
                <ShieldCheck size={24} style={{ margin: '0 auto 0.5rem' }} />
                <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Incidencia Registrada</h4>
                <p style={{ fontSize: '0.9rem' }}>Tu solicitud ha sido remitida al Call Center. Redirigiendo a tu historial...</p>
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
                      <option value="credito">Consulta o prórroga de Crédito Propio (30 días)</option>
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
