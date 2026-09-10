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
      const data = await getOrden(ordenId || 'ORD-2026-08941');
      setOrden(data);
      setLoading(false);
    };
    fetchOrderData();
  }, [ordenId]);

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
              <h1 className="confirmacion-title">¡Orden confirmada!</h1>
              <p className="order-number-text">
                Número de orden: <span className="order-number-highlight">#{orden?.id}</span>
              </p>
            </div>

            {/* Circuit Breaker Status Banner */}
            <div className="status-banner-card">
              <Info className="banner-info-icon" size={24} />
              <div>
                <h4 className="banner-heading">Procesando transmisión omnicanal</h4>
                <p className="banner-subtext">
                  Tu orden ha sido registrada en SGO-Logic. Facturación electrónica enviada a SAT.
                </p>
              </div>
            </div>

            {/* Glassmorphism Order Summary Breakdown */}
            <div className="order-summary-glass">
              <h3 className="summary-section-title">Resumen de orden</h3>
              
              <div className="summary-rows-group">
                <div className="summary-line">
                  <span>Productos ({orden?.items?.length || 1})</span>
                  <span>${orden?.subtotal ? orden.subtotal.toFixed(2) : '319.49'}</span>
                </div>
                <div className="summary-line">
                  <span>Envío ({orden?.metodoEntrega || 'Express'})</span>
                  <span>{orden?.envio === 0 ? 'Gratis' : `$${orden?.envio?.toFixed(2) || '15.00'}`}</span>
                </div>
                <div className="summary-line">
                  <span>Método de pago</span>
                  <span>{orden?.metodoPago || 'PayKlik (Tarjeta **** 4242)'}</span>
                </div>
                
                <div className="summary-line total-line">
                  <span>Total pagado</span>
                  <span className="total-highlight">${orden?.total ? orden.total.toFixed(2) : '357.83'}</span>
                </div>
              </div>
            </div>

            {/* Estimated Delivery Widget */}
            <div className="delivery-estimate-card">
              <Calendar size={20} className="icon-orange" />
              <span>Entrega estimada: <strong>Mañana, 26-28 ago 2026</strong></span>
            </div>

            {/* Action Buttons */}
            <div className="confirmacion-actions">
              <button
                onClick={() => navigate(`/seguimiento/${orden?.id}`)}
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
