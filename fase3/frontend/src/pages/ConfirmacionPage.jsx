import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Info, ArrowRight, Store, Calendar, ShieldCheck, Truck } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getOrden } from '../services/api';

export const ConfirmacionPage = () => {
  const { ordenId } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      try {
        const targetId = ordenId || localStorage.getItem('lastOrder');
        if (targetId) {
          const data = await getOrden(targetId);
          setOrden(data);
        }
      } catch (err) {
        console.warn('Error al cargar orden en confirmacion:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderData();
  }, [ordenId]);

  const getEstimatedDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const esCreditoPropio = orden?.metodoPago === 'credito_propio' ||
    orden?.metodoPago === 'CREDITO_PROPIO_30D' ||
    (typeof orden?.metodoPago === 'string' && (
      orden?.metodoPago.toLowerCase().includes('credito propio') ||
      orden?.metodoPago.toLowerCase().includes('30 dias') ||
      orden?.metodoPago.toLowerCase().includes('30 días') ||
      orden?.metodoPago.toLowerCase().includes('bnpl')
    ));

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
            {/* Big Success Check Badge */}
            <div className="success-icon-wrapper">
              <CheckCircle2 size={54} className="success-check-icon" />
            </div>

            {/* Title & Order ID */}
            <div className="confirmacion-header-text">
              <h1 className="confirmacion-title">Orden confirmada exitosamente</h1>
              <p className="order-number-text">
                Número de orden: <span className="order-number-highlight">#{orden?.id || 'PROCESANDO'}</span>
              </p>
            </div>

            {/* Circuit Breaker Status Banner */}
            <div className="status-banner-card">
              <Info className="banner-info-icon" size={24} />
              <div>
                <h4 className="banner-heading">Procesando transmisión omnicanal</h4>
                <p className="banner-subtext">
                  Tu orden ha sido registrada en SGO-Logic. Facturación electrónica emitida y despacho en curso.
                </p>
              </div>
            </div>

            {/* Glassmorphism Order Summary Breakdown */}
            <div className="order-summary-glass">
              <h3 className="summary-section-title">Resumen de orden</h3>
              
              <div className="summary-rows-group">
                <div className="summary-line">
                  <span>Productos ({orden?.items?.length || 0})</span>
                  <span>${orden?.subtotal ? Number(orden.subtotal).toFixed(2) : '0.00'}</span>
                </div>
                <div className="summary-line">
                  <span>Envío ({orden?.metodoEntrega || 'Envio a Domicilio'})</span>
                  <span>{orden?.envio === 0 ? 'Gratis' : `$${(Number(orden?.envio) || 0).toFixed(2)}`}</span>
                </div>
                <div className="summary-line">
                  <span>Método de pago</span>
                  <span>{esCreditoPropio ? 'Crédito Propio MegaStore (Paga en 30 días)' : (orden?.metodoPago || 'PayKlik')}</span>
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

            {/* Estimated Delivery Widget */}
            <div className="delivery-estimate-card">
              <Calendar size={20} className="icon-orange" />
              <span>Entrega estimada: <strong>{getEstimatedDate()}</strong></span>
            </div>

            {esCreditoPropio && (
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
                <span>Ver estado de mi orden</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => navigate('/catalogo')}
                className="btn-secondary flex-1-btn"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
