import React, { useState, useEffect } from 'react';
import {
  HelpCircle, LifeBuoy, X, ShieldCheck, Phone, Mail, MessageSquare,
  AlertTriangle, FileText, ChevronRight, CheckCircle2, Clock, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrdenes, registrarIncidenciaCliente, getIncidencias } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

export const GlobalHelpWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('atencion'); // 'atencion' | 'historial' | 'faq'
  const [userOrders, setUserOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('GENERAL');
  const [incidentType, setIncidentType] = useState('pago');
  const [incidentDetail, setIncidentDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [ticketsList, setTicketsList] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Ocultar widget en vistas administrativas / dashboard para el rol de operaciones
  const esVistaAdmin = location.pathname.startsWith('/admin') ||
                       location.pathname.startsWith('/dashboard') ||
                       location.pathname.includes('/dashboard');
  if (esVistaAdmin) {
    return null;
  }

  // Escuchar evento global 'open-help-modal' para apertura programática desde cualquier componente
  useEffect(() => {
    const handleGlobalOpen = (e) => {
      setIsOpen(true);
      if (e.detail?.ordenId) {
        setSelectedOrder(e.detail.ordenId);
      }
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('open-help-modal', handleGlobalOpen);
    return () => window.removeEventListener('open-help-modal', handleGlobalOpen);
  }, []);

  // Cargar órdenes del usuario al abrir el widget
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const all = await getOrdenes();
        if (!isMounted) return;
        if (user && Array.isArray(all)) {
          const filtered = all.filter(o =>
            (o.clienteNombre && user.nombre && o.clienteNombre.toLowerCase() === user.nombre.toLowerCase()) ||
            (o.cliente && user.nombre && o.cliente.toLowerCase() === user.nombre.toLowerCase()) ||
            (o.clienteId && String(o.clienteId) === String(user.id))
          );
          setUserOrders(filtered.length > 0 ? filtered : all.slice(0, 5));
        } else if (Array.isArray(all)) {
          setUserOrders(all.slice(0, 5));
        }
      } catch (err) {
        console.warn('Error cargando órdenes para soporte:', err);
      }
    };

    fetchOrders();
    return () => { isMounted = false; };
  }, [isOpen, user]);

  // Cargar historial de tickets/incidencias
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const allIncidencias = await getIncidencias();
      if (Array.isArray(allIncidencias)) {
        if (selectedOrder && selectedOrder !== 'GENERAL') {
          setTicketsList(allIncidencias.filter(inc => String(inc.ordenId).toLowerCase() === String(selectedOrder).toLowerCase()));
        } else if (userOrders.length > 0) {
          const orderIds = new Set(userOrders.map(o => String(o.id).toLowerCase()));
          orderIds.add('general');
          setTicketsList(allIncidencias.filter(inc => orderIds.has(String(inc.ordenId).toLowerCase())));
        } else {
          setTicketsList(allIncidencias);
        }
      }
    } catch (e) {
      console.warn('Error cargando tickets:', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'historial') {
      fetchTickets();
    }
  }, [isOpen, activeTab, selectedOrder]);

  const handleSubmitIncident = async (e) => {
    e.preventDefault();
    if (!incidentDetail.trim()) return;

    setSubmitting(true);
    try {
      const targetOrder = selectedOrder || 'GENERAL';
      await registrarIncidenciaCliente(targetOrder, incidentType, incidentDetail.trim());
      setSubmitSuccess(true);
      setIncidentDetail('');
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('historial');
        fetchTickets();
      }, 1500);
    } catch (err) {
      console.warn('Error al registrar incidencia:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Botón Flotante Omnipresente (FAB) */}
      <div
        className="global-help-fab"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9990,
          background: 'linear-gradient(135deg, rgba(20, 23, 31, 0.98), rgba(30, 35, 48, 0.95))',
          border: '1.5px solid var(--orange-primary, #fd6c00)',
          borderRadius: '32px',
          padding: '10px 18px',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 30px rgba(253, 108, 0, 0.4), 0 2px 10px rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 36px rgba(253, 108, 0, 0.55), 0 4px 14px rgba(0, 0, 0, 0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(253, 108, 0, 0.4), 0 2px 10px rgba(0, 0, 0, 0.8)';
        }}
        title="Centro de Atención y Soporte Omnicanal SGO-Logic"
      >
        <div style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'rgba(253, 108, 0, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--orange-primary, #fd6c00)'
        }}>
          <LifeBuoy size={18} />
        </div>
        <div className="fab-text-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, fontSize: '0.86rem', letterSpacing: '0.2px', lineHeight: 1.2 }}>
            ¿Necesitas ayuda?
          </span>
          <span style={{ fontSize: '0.70rem', color: '#fba04b', fontWeight: 500 }}>
            Soporte Omnicanal 24/7
          </span>
        </div>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#10b981',
          boxShadow: '0 0 6px #10b981',
          marginLeft: '2px'
        }} title="Soporte en línea"></span>
      </div>

      {/* Modal Global de Ayuda y Soporte */}
      {isOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsOpen(false)}
          style={{ zIndex: 9999 }}
        >
          <div
            className="profile-modal-card glass-panel animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header del Modal */}
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="icon-badge" style={{ background: 'rgba(253, 108, 0, 0.18)', color: 'var(--orange-primary)' }}>
                  <LifeBuoy size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 700 }}>
                    Centro de Atención y Soporte
                  </h3>
                  <p className="modal-subtitle">
                    Asistencia inmediata en pagos, inventario, facturación y logística omnicanal
                  </p>
                </div>
              </div>
              <button
                className="btn-close-modal"
                onClick={() => setIsOpen(false)}
                title="Cerrar ventana"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Selector de Pestañas */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              paddingBottom: '0.5rem',
              marginTop: '0.25rem'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('atencion')}
                className={`btn-sm ${activeTab === 'atencion' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                Registrar Solicitud
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('historial')}
                className={`btn-sm ${activeTab === 'historial' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                Mis Tickets ({ticketsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={`btn-sm ${activeTab === 'faq' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                Preguntas Frecuentes
              </button>
            </div>

            {/* TAB 1: REGISTRAR ATENCIÓN / SOLICITUD */}
            {activeTab === 'atencion' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                {/* Canales Directos */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '0.6rem'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Call Center 24/7</span>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>+502 2400-0000</strong>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--orange-primary)' }}>Extensión 2 (Órdenes)</span>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>WhatsApp Express</span>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>+502 5555-7465</strong>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#34d399' }}>Respuesta en &lt; 5 min</span>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mesa de Ayuda</span>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>soporte@megastore.com</strong>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>Casos y devoluciones</span>
                  </div>
                </div>

                {submitSuccess ? (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <CheckCircle2 size={32} style={{ color: '#10b981', margin: '0 auto 0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 700 }}>Solicitud Registrada Exitosamente</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#a7f3d0' }}>
                      Tu requerimiento fue canalizado con éxito a la central de soporte. Abriendo historial de tickets...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitIncident} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* Orden Asociada */}
                    <div>
                      <label className="form-label">Orden Relacionada</label>
                      <select
                        className="form-input"
                        value={selectedOrder}
                        onChange={(e) => setSelectedOrder(e.target.value)}
                      >
                        <option value="GENERAL">Consulta General / Sin Orden Específica</option>
                        {userOrders.map(ord => (
                          <option key={ord.id} value={ord.id}>
                            {ord.id} — Total: ${(Number(ord.total) || 0).toFixed(2)} ({ord.estado})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tipo de Requerimiento */}
                    <div>
                      <label className="form-label">Tipo de Requerimiento o Problema</label>
                      <select
                        className="form-input"
                        value={incidentType}
                        onChange={(e) => setIncidentType(e.target.value)}
                      >
                        <option value="pago">Aclaración de cobro / Pago en contingencia PayKlik</option>
                        <option value="stock">Disponibilidad de inventario / Stock insuficiente</option>
                        <option value="demora">Demora o consulta de entrega LogiExpress</option>
                        <option value="credito">Consulta o liquidación de Crédito Propio (BNPL 30 días)</option>
                        <option value="direccion">Corrección de dirección o sucursal de retiro</option>
                        <option value="cancelacion">Solicitud de anulación y liberación de stock</option>
                        <option value="tecnico">Error en la aplicación o consulta general</option>
                      </select>
                    </div>

                    {/* Detalle */}
                    <div>
                      <label className="form-label">Detalles de tu solicitud</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Escribe aquí los detalles del inconveniente o la consulta que deseas resolver..."
                        value={incidentDetail}
                        onChange={(e) => setIncidentDetail(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="btn-secondary btn-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !incidentDetail.trim()}
                        className="btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Send size={14} />
                        <span>{submitting ? 'Enviando...' : 'Enviar a Soporte Omnicanal'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: HISTORIAL DE TICKETS */}
            {activeTab === 'historial' && (
              <div style={{ marginTop: '0.5rem' }}>
                {loadingTickets ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Cargando bitácora de tickets...
                  </p>
                ) : ticketsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
                    <ShieldCheck size={40} style={{ color: 'var(--orange-primary)', margin: '0 auto 0.75rem', opacity: 0.8 }} />
                    <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.92rem' }}>
                      No tienes tickets ni quejas registradas en el sistema.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('atencion')}
                      className="btn-primary btn-sm"
                    >
                      Registrar una solicitud
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                    {ticketsList.map((inc) => (
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
                          <span className="font-mono text-orange" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                            TCK-{inc.id}
                          </span>
                          <span className={`badge ${inc.respuesta ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                            {inc.respuesta ? 'RESPONDIDO' : 'REGISTRADO'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px' }}>
                          Orden: <span className="font-mono">{inc.ordenId}</span> — {inc.tipoEvento?.replace('INCIDENCIA_', '').toUpperCase()}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.4 }}>
                          {inc.detalle}
                        </p>
                        {inc.respuesta && (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.28)',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            margin: '6px 0 8px 0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                              <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                              <strong style={{ fontSize: '0.78rem', color: '#34d399' }}>Respuesta de Soporte MegaStore:</strong>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.80rem', color: '#a7f3d0', lineHeight: 1.4 }}>
                              {inc.respuesta}
                            </p>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {new Date(inc.fecha).toLocaleString()}
                          </span>
                          {inc.ordenId && inc.ordenId !== 'GENERAL' && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/seguimiento/${inc.ordenId}`);
                              }}
                              className="link-action"
                              style={{ fontSize: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--orange-primary)' }}
                            >
                              Ver Seguimiento &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PREGUNTAS FRECUENTES Y ERRORES COMUNES */}
            {activeTab === 'faq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', maxHeight: '380px', overflowY: 'auto' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px 14px'
                }}>
                  <strong style={{ color: 'var(--orange-primary)', display: 'block', fontSize: '0.88rem', marginBottom: '4px' }}>
                    1. ¿Por que mi pago aparece como "En Proceso de Confirmacion"?
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Si la pasarela PayKlik se encuentra en modo de contingencia o alta demanda, la transaccion se encola de forma segura en la cola DLQ de RabbitMQ. Tu reserva de inventario permanece bloqueada y asegurada. El cobro se procesara automaticamente o puedes pulsar "Reintentar Pago Ahora" en Mis Pedidos.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px 14px'
                }}>
                  <strong style={{ color: 'var(--orange-primary)', display: 'block', fontSize: '0.88rem', marginBottom: '4px' }}>
                    2. ¿Que ocurre cuando sale "Inventario Insuficiente"?
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    MegaStore SGO-Logic cuenta con inventario unificado en tiempo real con bloqueo optimista. Si otro cliente adquiere existencias simultaneamente, el sistema previene la sobreventa. Puedes usar el boton instantaneo "Ajustar mi pedido al stock disponible" en Checkout o Carrito para comprar las existencias que quedan en bodega.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px 14px'
                }}>
                  <strong style={{ color: 'var(--orange-primary)', display: 'block', fontSize: '0.88rem', marginBottom: '4px' }}>
                    3. ¿Como funciona la reserva de inventario de 15 minutos?
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Al confirmar tu pedido, las unidades se descuentan del stock fisico y se registra una reserva temporal con TTL de 15 minutos en PostgreSQL. Si el pago se confirma, la venta queda consolidada; si no se cancela o expira el tiempo, el sistema devuelve el stock automaticamente al catalogo.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px 14px'
                }}>
                  <strong style={{ color: 'var(--orange-primary)', display: 'block', fontSize: '0.88rem', marginBottom: '4px' }}>
                    4. ¿Como calificar al Credito Propio 'Compra ahora, paga en 30 dias'?
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    El motor de scoring evalua tu historial en AS/400. Requiere un score crediticio minimo de 70 puntos y que el monto no exceda tu saldo disponible (limite maximo Q5,000). Esta modalidad tiene 0% de interes y 0 recargos, sin exigir tarjeta bancaria.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px 14px'
                }}>
                  <strong style={{ color: 'var(--orange-primary)', display: 'block', fontSize: '0.88rem', marginBottom: '4px' }}>
                    5. ¿Donde consultar el rastreo de mi pedido?
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Puedes acceder a la seccion 'Mis Pedidos' desde la barra superior o ingresar tu codigo de rastreo LEX de LogiExpress en el buscador de seguimiento para visualizar cada transicion en tiempo real gracias al bus de eventos RabbitMQ y notificaciones reactivas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
