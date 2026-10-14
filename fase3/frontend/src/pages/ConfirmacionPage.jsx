import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, Info, ArrowRight, Store, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Footer } from '../components/Footer';
import { getOrden, obtenerHistorialPagoOrden } from '../services/api';
import { esMetodoCreditoPropio } from '../utils/checkoutUtils';
import { useAuth } from '../context/AuthContext';

export const ConfirmacionPage = () => {
  const { ordenId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const [orden, setOrden] = useState(null);
  const [pagoStatus, setPagoStatus] = useState({ online: true, intentos: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const targetId = ordenId || localStorage.getItem('lastOrder');

    const fetchOrderAndPayment = async (initial = false) => {
      if (initial) setLoading(true);
      try {
        if (targetId) {
          const [data, histPago] = await Promise.all([
            getOrden(targetId),
            obtenerHistorialPagoOrden(targetId)
          ]);
          if (isMounted) {
            setOrden(data);
            setPagoStatus(histPago);
          }
        }
      } catch (err) {
        console.warn('Error al cargar orden en confirmacion:', err);
      } finally {
        if (initial && isMounted) setLoading(false);
      }
    };

    fetchOrderAndPayment(true);
    const interval = setInterval(() => fetchOrderAndPayment(false), 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [ordenId]);

  const getEstimatedDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const esCreditoPropio = esMetodoCreditoPropio(orden?.metodoPago);
  const ultimoIntento = pagoStatus.intentos && pagoStatus.intentos.length > 0
    ? pagoStatus.intentos[pagoStatus.intentos.length - 1]
    : null;

  const esSinStock = orden?.estado === 'INVENTARIO_INSUFICIENTE';
  const esCancelada = orden?.estado === 'CANCELADA';
  const esOrdenFallida = esSinStock || esCancelada;

  const enContingenciaPagos =
    !esOrdenFallida && (
      !pagoStatus.online ||
      orden?.estado === 'PAGO_EN_CONTINGENCIA' ||
      ultimoIntento?.resultado === 'ENCOLADO_CONTINGENCIA'
    );

  return (
    <div className="app-container">
      {/* Header with Brand Logo */}
      <header className="checkout-header">
        <div className="checkout-header-content flex-center">
          <Link to="/" className="navbar-logo">
            <div className="logo-badge">
              <Store className="logo-icon" />
            </div>
            <span className="brand-name">MegaStore</span>
          </Link>
        </div>
      </header>

      <main className="main-content confirmacion-layout animate-fade-in">
        {loading ? (
          <div className="loading-container glass-panel">
            <div className="spinner"></div>
            <p>Generando factura electrónica y unificando orden...</p>
          </div>
        ) : (
          <div className="confirmacion-card glass-panel">
            {/* Big Status Badge */}
            <div className="success-icon-wrapper">
              {esOrdenFallida ? (
                <AlertTriangle size={54} style={{ color: '#ef4444' }} />
              ) : (
                <CheckCircle2 size={54} className="success-check-icon" />
              )}
            </div>

            {/* Title & Order ID */}
            <div className="confirmacion-header-text">
              <h1 className="confirmacion-title" style={esOrdenFallida ? { color: '#f87171' } : {}}>
                {esSinStock
                  ? 'Orden detenida por falta de stock'
                  : esCancelada
                    ? 'Orden cancelada'
                    : 'Orden confirmada exitosamente'}
              </h1>
              <p className="order-number-text">
                Número de orden: <span className="order-number-highlight">#{orden?.id || 'PROCESANDO'}</span>
              </p>
            </div>

            {/* Banner State: Fallida vs Contingencia vs Confirmada */}
            {esOrdenFallida ? (
              <div
                className="status-banner-card"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#f87171'
                }}
              >
                <AlertTriangle size={26} style={{ color: '#ef4444', flexShrink: 0 }} />
                <div>
                  <h4 className="banner-heading" style={{ color: '#f87171' }}>
                    {esSinStock ? 'Existencias Insuficientes en Bodega' : 'Orden Cancelada'}
                  </h4>
                  <p className="banner-subtext" style={{ color: '#fca5a5' }}>
                    {esSinStock
                      ? 'Uno o más productos seleccionados se agotaron en bodega durante el procesamiento concurrente. No se ha efectuado ningún cobro a tu cuenta.'
                      : 'Esta orden ha sido cancelada y cualquier reserva de inventario asociada fue liberada al almacén.'}
                  </p>
                </div>
              </div>
            ) : enContingenciaPagos ? (
              <div
                className="status-banner-card"
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: '#fbbf24'
                }}
              >
                <AlertTriangle size={26} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <div>
                  <h4 className="banner-heading" style={{ color: '#fbbf24' }}>
                    Procesamiento de Pago en Curso
                  </h4>
                  <p className="banner-subtext" style={{ color: '#fde68a' }}>
                    Tu orden #{orden?.id} y la reserva de tus artículos se han registrado exitosamente. La validación del pago se encuentra en proceso de confirmación y se completará automáticamente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="status-banner-card">
                <Info className="banner-info-icon" size={24} />
                <div>
                  <h4 className="banner-heading">
                    Orden Registrada con Éxito
                  </h4>
                  <p className="banner-subtext">
                    Tu pedido ha sido confirmado.{' '}
                    {ultimoIntento?.referenciaPayklik
                      ? `Transacción autorizada con referencia ${ultimoIntento.referenciaPayklik}. Facturación electrónica y preparación de envío en curso.`
                      : 'Facturación electrónica y preparación de envío en curso.'}
                  </p>
                </div>
              </div>
            )}

            {/* Glassmorphism Order Summary Breakdown */}
            <div className="order-summary-glass">
              <h3 className="summary-section-title">Resumen de orden</h3>
              
              <div className="summary-rows-group">
                <div className="summary-line">
                  <span>Productos ({orden?.items?.length || 0})</span>
                  <span>${orden?.subtotal ? Number(orden.subtotal).toFixed(2) : '0.00'}</span>
                </div>
                <div className="summary-line">
                  <span>Impuestos (12% IVA SAT)</span>
                  <span>${orden?.impuestos ? Number(orden.impuestos).toFixed(2) : '0.00'}</span>
                </div>
                <div className="summary-line">
                  <span>Envío ({orden?.metodoEntrega || 'Envio a Domicilio'})</span>
                  <span>{orden?.envio === 0 ? 'Gratis' : `$${(Number(orden?.envio) || 0).toFixed(2)}`}</span>
                </div>
                <div className="summary-line">
                  <span>Método de pago</span>
                  <span>{esCreditoPropio ? 'Crédito Propio MegaStore (Paga en 30 días)' : (orden?.metodoPago || 'PayKlik')}</span>
                </div>
                <div className="summary-line">
                  <span>Estado del cobro</span>
                  <span style={{ fontWeight: 700, color: esOrdenFallida ? '#ef4444' : (enContingenciaPagos ? '#fbbf24' : '#34d399') }}>
                    {esOrdenFallida
                      ? 'SIN CARGO / ANULADO'
                      : (!pagoStatus.online
                        ? 'EN PROCESO DE CONFIRMACIÓN'
                        : (ultimoIntento?.resultado === 'ENCOLADO_CONTINGENCIA'
                          ? 'EN PROCESO DE CONFIRMACIÓN'
                          : (orden?.estado !== 'CREADA' ? 'CONFIRMADO' : 'EN PROCESO')))}
                  </span>
                </div>

                {esCreditoPropio && (
                  <div className="summary-line" style={{ color: 'var(--orange-primary)', fontSize: '0.85rem' }}>
                    <span>Condición crediticia</span>
                    <span>0% recargo — 30 días de gracia</span>
                  </div>
                )}
                
                <div className="summary-line total-line">
                  <span>{esCreditoPropio ? 'Total financiado a 30 días' : 'Total pagado'}</span>
                  <span className="total-highlight">${orden?.total ? Number(orden.total).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Estimated Delivery Widget (only for active orders) */}
            {!esOrdenFallida && (
              <div className="delivery-estimate-card">
                <Calendar size={20} className="icon-orange" />
                <span>Entrega estimada: <strong>{getEstimatedDate()}</strong></span>
              </div>
            )}

            {esCreditoPropio && !esOrdenFallida && (
              <div className="delivery-estimate-card" style={{ marginTop: '0.75rem', borderColor: 'rgba(255, 107, 0, 0.35)' }}>
                <ShieldCheck size={20} className="icon-orange" />
                <span>
                  Fecha límite de pago: <strong>{
                    (() => {
                      const d = new Date(orden?.fechaCreacion || orden?.fecha || Date.now());
                      d.setDate(d.getDate() + 30);
                      return d.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                    })()
                  }</strong> (Sin intereses)
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="confirmacion-actions">
              <button
                onClick={() => navigate(orden?.id ? `/seguimiento/${orden.id}` : '/seguimiento')}
                className="btn-primary flex-1-btn"
              >
                <span>{esOrdenFallida ? 'Ver detalle en Seguimiento' : 'Ver estado de mi orden'}</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => navigate('/catalogo')}
                className="btn-secondary flex-1-btn"
              >
                {esOrdenFallida ? 'Volver al catálogo a elegir productos' : 'Seguir comprando'}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

