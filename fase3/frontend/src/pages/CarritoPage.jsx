import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, RefreshCw, Lock, Tag, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { CartItem } from '../components/CartItem';
import { Footer } from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { consultarDisponibilidadProducto } from '../services/api';

export const CarritoPage = () => {
  const { cartItems, totalCount, subtotal, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0.00);
  const [stockStatusMap, setStockStatusMap] = useState({});
  const [validatingStock, setValidatingStock] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const checkStock = async () => {
      if (cartItems.length === 0) return;
      setValidatingStock(true);
      const newStatus = {};
      for (const item of cartItems) {
        const disp = await consultarDisponibilidadProducto(item.id);
        if (disp !== null) {
          newStatus[item.id] = {
            disponible: disp.totalDisponible,
            insuficiente: item.cantidad > disp.totalDisponible
          };
        }
      }
      if (isMounted) {
        setStockStatusMap(newStatus);
        setValidatingStock(false);
      }
    };
    checkStock();
    const interval = setInterval(checkStock, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [cartItems]);

  const handleAjustarStockTodo = () => {
    for (const item of cartItems) {
      const status = stockStatusMap[item.id];
      if (status && status.insuficiente) {
        if (status.disponible > 0) {
          updateQuantity(item.id, status.disponible);
        } else {
          removeFromCart(item.id);
        }
      }
    }
  };

  const itemsConErrorStock = cartItems.filter(item => stockStatusMap[item.id]?.insuficiente);
  const hayErrorStock = itemsConErrorStock.length > 0;

  if (!user) {
    return <Navigate to="/login?redirect=/carrito" replace />;
  }

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (discountCode.trim()) {
      setDiscountApplied(25.00);
    }
  };

  const taxes = +(subtotal * 0.12).toFixed(2);
  const shippingCost = 15.00;
  const grandTotal = Math.max(0, +(subtotal + taxes - discountApplied + shippingCost).toFixed(2));

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content carrito-layout">
        {/* Header Bar */}
        <div className="carrito-header">
          <div>
            <h1 className="page-title">Mi carrito</h1>
            <p className="page-subtitle">Revisa tus artículos antes de finalizar la compra</p>
          </div>
          <div className="sync-badge">
            <RefreshCw size={16} className="spin-slow" />
            <span>Sincronizado en todos tus dispositivos</span>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart glass-panel">
            <div className="empty-icon-box">
              <ShoppingBag size={48} />
            </div>
            <h2>Tu carrito está vacío</h2>
            <p>Explora nuestro catálogo y agrega productos para iniciar tu compra omnicanal.</p>
            <Link to="/catalogo" className="btn-primary">
              <ArrowLeft size={18} />
              <span>Explorar catálogo</span>
            </Link>
          </div>
        ) : (
          <div className="carrito-grid">
            {/* Left Items List */}
            <section className="cart-items-section">
              <div className="items-list-header">
                <h3>Artículos en el carrito ({totalCount})</h3>
              </div>

              <div className="items-container">
                {cartItems.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </section>

            {/* Right Summary Sidebar */}
            <aside className="summary-sidebar">
              <div className="summary-card glass-panel">
                <h3 className="summary-title">Resumen del pedido</h3>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyCoupon} className="coupon-form">
                  <div className="input-icon-wrapper">
                    <Tag size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Código de cupón (Ej. SGO2026)"
                      className="form-input with-icon"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-secondary btn-sm">Aplicar</button>
                </form>

                {/* Subtotal & Totals breakdown */}
                <div className="summary-breakdown">
                  <div className="summary-row">
                    <span>Subtotal ({totalCount} artículos)</span>
                    <span className="summary-value">${subtotal.toFixed(2)}</span>
                  </div>

                  <div className="summary-row">
                    <span>Impuestos (12% IVA)</span>
                    <span className="summary-value">${taxes.toFixed(2)}</span>
                  </div>

                  {discountApplied > 0 && (
                    <div className="summary-row text-orange">
                      <span>Descuento aplicado</span>
                      <span className="summary-value">-${discountApplied.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="summary-row">
                    <span>Envío estimado (Domicilio)</span>
                    <span className="summary-value">
                      {shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-total-row">
                    <div>
                      <span className="total-label">Total</span>
                      <p className="tax-included font-label-sm">IVA 12% incluido</p>
                    </div>
                    <span className="total-amount">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="summary-actions">
                  {hayErrorStock && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid #ef4444',
                      color: '#f87171',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem'
                    }}>
                      <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#f87171', display: 'block' }}>Inventario Insuficiente</strong>
                        <span>
                          {itemsConErrorStock.map(it => `"${it.nombre}": solicitaste ${it.cantidad} uds pero solo hay ${stockStatusMap[it.id]?.disponible} disponibles en bodega.`).join(' ')}
                        </span>
                        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#fca5a5' }}>
                          Ajusta las cantidades con el botón inferior para continuar con la compra.
                        </p>
                        <div style={{ marginTop: '0.65rem' }}>
                          <button
                            type="button"
                            onClick={handleAjustarStockTodo}
                            className="btn-primary btn-sm"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
                          >
                            Ajustar cantidades al stock disponible
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleProceedToCheckout}
                    disabled={hayErrorStock || validatingStock}
                    className="btn-primary btn-block btn-checkout"
                    style={hayErrorStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    title={hayErrorStock ? 'Ajusta las cantidades para proceder' : 'Proceder al checkout'}
                  >
                    <span>{validatingStock ? 'Verificando inventario...' : (hayErrorStock ? 'Stock insuficiente' : 'Proceder al pago')}</span>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    onClick={() => navigate('/catalogo')}
                    className="btn-secondary btn-block"
                  >
                    Seguir comprando
                  </button>
                </div>

                {/* Security Tag */}
                <div className="security-tag">
                  <Lock size={16} />
                  <span>Pago seguro garantizado con cifrado SSL</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
