import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Truck, HelpCircle, Package, ArrowLeft, ShieldCheck, MapPin } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { OrderTimeline } from '../components/OrderTimeline';
import { Footer } from '../components/Footer';
import { getOrden } from '../services/api';

export const SeguimientoPage = () => {
  const { ordenId } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      const data = await getOrden(ordenId || 'ORD-2026-08941');
      setOrden(data);
      setLoading(false);
    };
    fetchOrderData();
  }, [ordenId]);

  const handleSearchOrder = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/seguimiento/${encodeURIComponent(searchId.trim())}`);
    }
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
                placeholder="Buscar por ID de orden (Ej. ORD-2026-08941)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary btn-sm">Buscar</button>
          </form>
        </div>

        {loading ? (
          <div className="loading-container glass-panel">
            <div className="spinner"></div>
            <p>Consultando estado en bus de eventos Omnicanal...</p>
          </div>
        ) : !orden ? (
          <div className="empty-results glass-panel">
            <p>No se encontró ninguna orden con el código especificado.</p>
          </div>
        ) : (
          <div className="seguimiento-main-grid">
            {/* Tracking Code Banner Card */}
            <div className="tracking-code-card glass-panel">
              <div className="tracking-info">
                <span className="tracking-label">Código de Rastreo LogiExpress</span>
                <span className="tracking-code">{orden.codigoRastreo || 'LEX-849204-GT'}</span>
              </div>
              <button className="btn-secondary btn-help">
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
              <h3 className="panel-title">Detalles de la Orden</h3>

              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Cliente</span>
                  <span className="detail-val">{orden.cliente}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Canal de origen</span>
                  <span className="detail-val badge badge-info">{orden.canal}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Dirección de entrega</span>
                  <span className="detail-val flex-center-gap">
                    <MapPin size={14} className="icon-orange" />
                    {orden.direccion}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Método de pago</span>
                  <span className="detail-val">{orden.metodoPago}</span>
                </div>
              </div>

              {/* Items summary snapshot */}
              <div className="items-snapshot">
                <h4 className="snapshot-title">Contenido del paquete ({orden.items?.length || 0})</h4>
                <div className="snapshot-list">
                  {orden.items?.map((item, idx) => (
                    <div key={idx} className="snapshot-row">
                      <span className="snapshot-name">• {item.nombre}</span>
                      <span className="snapshot-qty">x{item.cantidad}</span>
                      <span className="snapshot-price">${(item.precio * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
