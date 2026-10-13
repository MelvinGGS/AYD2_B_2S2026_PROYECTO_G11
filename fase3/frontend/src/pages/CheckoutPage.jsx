import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Truck, Store, CreditCard, Building2, Wallet, ArrowLeft, Lock, CheckCircle2, Shield, AlertTriangle, X, CalendarClock, Sparkles, Trash2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { crearOrden, evaluarCredito } from '../services/api';
import {
  validarElegibilidadCredito,
  calcularVencimientoCredito,
  formatearDetalleBNPL,
  filtrarMetodosPagoDisponibles,
  validarFormularioCheckout
} from '../utils/checkoutUtils';

export const CheckoutPage = () => {
  const { cartItems, subtotal, clearCart } = useCart();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login?redirect=/checkout" replace />;
  }

  const [deliveryType, setDeliveryType] = useState('domicilio');
  const [paymentMethod, setPaymentMethod] = useState('payklik');
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [creditoInfo, setCreditoInfo] = useState(null);
  const [loadingCredito, setLoadingCredito] = useState(true);

  // Form Fields
  const [fullName, setFullName] = useState(user?.nombre || '');
  const [phone, setPhone] = useState(user?.telefono || '');
  const [address, setAddress] = useState(user?.direccion || '');

  // Card details
  const [selectedCardId, setSelectedCardId] = useState(user?.tarjetas?.length ? user.tarjetas[0].id : 'manual');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  React.useEffect(() => {
    if (user) {
      if (!fullName && user.nombre) setFullName(user.nombre);
      if (!phone && user.telefono) setPhone(user.telefono);
      if (!address && user.direccion) setAddress(user.direccion);
      if (user.tarjetas && user.tarjetas.length > 0 && selectedCardId === 'manual') {
        setSelectedCardId(user.tarjetas[0].id);
      }
    }
  }, [user]);

  const taxes = +(subtotal * 0.12).toFixed(2);
  const shipping = deliveryType === 'domicilio' ? 15.00 : 0.00;
  const total = +(subtotal + taxes + shipping).toFixed(2);

  // Evaluación de elegibilidad crediticia (Fase 3 - Campaña BNPL 30 días)
  React.useEffect(() => {
    let isMounted = true;
    const fetchCredito = async () => {
      if (user && total > 0) {
        setLoadingCredito(true);
        try {
          const evalRes = await evaluarCredito(user.id || '1', total);
          if (isMounted && evalRes) {
            const elegibleLocal = validarElegibilidadCredito(
              { creditScore: evalRes.score ?? user.creditScore ?? 80 },
              total,
              evalRes.saldoDisponible ?? 3500
            );
            const aprobadoFinal = Boolean(evalRes.aprobado && elegibleLocal);
            const infoNormalizada = { ...evalRes, aprobado: aprobadoFinal };
            setCreditoInfo(infoNormalizada);
            if (aprobadoFinal) {
              setPaymentMethod('credito_propio'); // Seleccionar Crédito Propio como opción recomendada si califica
            } else {
              setPaymentMethod(prev => (prev === 'credito_propio' ? 'payklik' : prev));
            }
          }
        } catch (e) {
          console.warn('Evaluación de crédito diferida:', e);
        } finally {
          if (isMounted) setLoadingCredito(false);
        }
      }
    };
    fetchCredito();
    return () => { isMounted = false; };
  }, [user, total]);

  // Cálculo de vencimiento, métodos disponibles y detalle comercial BNPL (checkoutUtils)
  const metodosDisponibles = React.useMemo(() => {
    return filtrarMetodosPagoDisponibles(
      ['payklik', 'transferencia', 'billetera'],
      Boolean(creditoInfo?.aprobado)
    );
  }, [creditoInfo]);

  const fechaVencimientoCalculada = React.useMemo(() => {
    try {
      return calcularVencimientoCredito(new Date(), 30);
    } catch {
      return '';
    }
  }, []);

  const detalleBNPL = React.useMemo(() => {
    if (!creditoInfo?.aprobado || total <= 0) return null;
    try {
      return formatearDetalleBNPL(total, 30, creditoInfo.fechaVencimiento || fechaVencimientoCalculada);
    } catch {
      return null;
    }
  }, [creditoInfo, total, fechaVencimientoCalculada]);

  const handleEliminarTarjeta = (tarjetaId) => {
    if (!user?.tarjetas) return;
    const filtradas = user.tarjetas.filter(t => t.id !== tarjetaId);
    if (updateProfile) {
      updateProfile({ tarjetas: filtradas });
    }
    setSelectedCardId(filtradas.length ? filtradas[0].id : 'manual');
  };

  const handleConfirmPurchase = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      navigate('/catalogo');
      return;
    }

    // Validación centralizada con checkoutUtils
    const validacion = validarFormularioCheckout(
      { nombreCompleto: fullName, telefono: phone, direccion: address, tipoEntrega: deliveryType },
      paymentMethod,
      { manual: selectedCardId === 'manual', numero: cardNumber, vencimiento: expiry, cvv }
    );

    if (!validacion.valido) {
      setCheckoutError(validacion.error || 'Por favor completa los campos requeridos.');
      return;
    }

    setLoading(true);
    setCheckoutError(null);
    try {
      const order = await crearOrden(
        cartItems,
        { clienteId: user?.id || '1', nombreCompleto: fullName, telefono: phone, direccion: address, tipoEntrega: deliveryType },
        { metodo: paymentMethod, plazoDias: paymentMethod === 'credito_propio' ? 30 : 0 }
      );
      if (order?.id) {
        localStorage.setItem('lastOrder', order.id);
      }
      clearCart();
      navigate(`/confirmacion/${order.id}`);
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError(err.message || 'Hubo un problema al procesar tu compra. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Minimal Header for Checkout as per Orange Mockup */}
      <header className="checkout-header">
        <div className="checkout-header-content">
          <Link to="/" className="navbar-logo">
            <div className="logo-badge">
              <Store className="logo-icon" />
            </div>
            <span className="brand-name">MegaStore</span>
          </Link>
          <div className="checkout-secure-badge">
            <Lock size={18} />
            <span>Checkout Seguro SSL</span>
          </div>
        </div>
      </header>

      <main className="main-content checkout-layout animate-fade-in">
        <div className="back-link-wrapper">
          <Link to="/carrito" className="back-link">
            <ArrowLeft size={18} />
            <span>Volver al carrito</span>
          </Link>
        </div>

        <div className="checkout-grid">
          {/* Left Column: Delivery & Payment Options */}
          <div className="checkout-main-forms">
            <h1 className="checkout-title">Finalizar Compra</h1>

            {checkoutError && (
              <div className="glass-panel" style={{ borderLeft: '4px solid var(--orange-primary)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', backgroundColor: 'rgba(255, 140, 0, 0.05)' }}>
                <AlertTriangle size={24} style={{ color: 'var(--orange-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600 }}>Alerta de Inventario</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{checkoutError}</p>
                </div>
                <button onClick={() => setCheckoutError(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Cerrar alerta">
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Delivery Method */}
            <section className="checkout-section glass-panel">
              <div className="section-title-row">
                <Truck className="icon-orange" size={22} />
                <h2>Método de Entrega</h2>
              </div>

              <div className="delivery-options-grid">
                <label className={`option-card ${deliveryType === 'domicilio' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="domicilio"
                    checked={deliveryType === 'domicilio'}
                    onChange={() => setDeliveryType('domicilio')}
                  />
                  <Truck size={28} className="option-icon" />
                  <span className="option-label">Envío a Domicilio</span>
                  <span className="option-sub">Entrega Express en 24-48 hrs</span>
                </label>

                <label className={`option-card ${deliveryType === 'tienda' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="tienda"
                    checked={deliveryType === 'tienda'}
                    onChange={() => setDeliveryType('tienda')}
                  />
                  <Store size={28} className="option-icon" />
                  <span className="option-label">Recoger en Tienda</span>
                  <span className="option-sub">Gratis en 32 sucursales</span>
                </label>
              </div>

              {/* Address Form (if Domicilio) */}
              {deliveryType === 'domicilio' && (
                <div className="shipping-address-form">
                  <h3>Dirección de Envío</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Nombre completo</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. Juan Pérez"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Teléfono de contacto</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. +502 5555 1234"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Dirección exacta</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. Avenida Reforma 12-01, Zona 10, Ciudad de Guatemala"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Payment Methods */}
            <section className="checkout-section glass-panel">
              <div className="section-title-row">
                <CreditCard className="icon-orange" size={22} />
                <h2>Método de Pago</h2>
              </div>

              <div className="payment-methods-list">
                {/* 1. OPCIÓN DESTACADA: Crédito Propio 'Compra ahora, paga en 30 días' (Fase 3 BNPL) */}
                {metodosDisponibles.includes('credito_propio') && creditoInfo?.aprobado && (
                  <div
                    className={`payment-method-card ${paymentMethod === 'credito_propio' ? 'selected' : ''}`}
                    style={{
                      borderColor: paymentMethod === 'credito_propio' ? 'var(--orange-primary)' : 'var(--border-accent)',
                      backgroundColor: paymentMethod === 'credito_propio' ? 'rgba(253, 108, 0, 0.08)' : 'rgba(253, 108, 0, 0.03)'
                    }}
                  >
                    <label className="payment-method-header">
                      <div className="payment-radio-group">
                        <input
                          type="radio"
                          name="payment"
                          value="credito_propio"
                          checked={paymentMethod === 'credito_propio'}
                          onChange={() => setPaymentMethod('credito_propio')}
                        />
                        <CalendarClock size={24} className="method-icon" style={{ color: 'var(--orange-primary)' }} />
                        <div>
                          <div className="method-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span>Crédito Propio MegaStore</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: '4px', background: 'var(--orange-gradient)', color: '#fff', letterSpacing: '0.5px' }}>
                              PAGA EN 30 DÍAS
                            </span>
                          </div>
                          <div className="method-desc" style={{ color: 'var(--text-secondary)' }}>
                            0% interés promocional • Fecha límite de pago: <strong style={{ color: 'var(--orange-hover)' }}>{creditoInfo.fechaVencimiento || fechaVencimientoCalculada || 'en 30 días'}</strong>
                          </div>
                        </div>
                      </div>
                      {paymentMethod === 'credito_propio' && <CheckCircle2 size={20} className="check-active" />}
                    </label>

                    {paymentMethod === 'credito_propio' && (
                      <div className="card-form-sub" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.82rem' }}>
                          <span style={{ background: 'rgba(0,0,0,0.3)', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            Cupo disponible: <strong style={{ color: 'var(--text-main)' }}>Q{creditoInfo.saldoDisponible?.toFixed(2)}</strong>
                          </span>
                          <span style={{ background: 'rgba(0,0,0,0.3)', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            Monto financiado: <strong style={{ color: 'var(--text-main)' }}>Q{total.toFixed(2)}</strong>
                          </span>
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            Score Crediticio: {creditoInfo.score}/100 (Aprobado)
                          </span>
                        </div>
                        {detalleBNPL && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--orange-hover)', fontWeight: 600 }}>
                            Condición comercial: {detalleBNPL.descripcion} (Tasa {detalleBNPL.tasaInteres}% / Apertura Q{detalleBNPL.recargoApertura.toFixed(2)})
                          </div>
                        )}
                        <p style={{ margin: '0.45rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          Al confirmar, tu orden será procesada y despachada de inmediato. Recibirás un recordatorio en tu correo antes del vencimiento.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notificación informativa si no califica para Crédito Propio */}
                {!loadingCredito && creditoInfo && !creditoInfo.aprobado && (
                  <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: '0.5rem', fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertTriangle size={18} style={{ color: 'var(--status-warning)', flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>Crédito propio a 30 días no disponible:</strong> {creditoInfo.mensaje || 'Historial de compras insuficiente o límite superado'}. Puedes abonar mediante PayKlik o transferencia bancaria.
                    </div>
                  </div>
                )}

                {/* PayKlik */}
                <div className={`payment-method-card ${paymentMethod === 'payklik' ? 'selected' : ''}`}>
                  <label className="payment-method-header">
                    <div className="payment-radio-group">
                      <input
                        type="radio"
                        name="payment"
                        value="payklik"
                        checked={paymentMethod === 'payklik'}
                        onChange={() => setPaymentMethod('payklik')}
                      />
                      <CreditCard size={24} className="method-icon" />
                      <div>
                        <div className="method-name">PayKlik Pasarela Unificada</div>
                        <div className="method-desc">Tarjeta de Crédito o Débito (Visa, Mastercard, Amex)</div>
                      </div>
                    </div>
                    {paymentMethod === 'payklik' && <CheckCircle2 size={20} className="check-active" />}
                  </label>

                  {/* Card Form */}
                  {paymentMethod === 'payklik' && (
                    <div className="card-form-sub">
                      {user?.tarjetas && user.tarjetas.length > 0 && (
                        <div className="form-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <label className="form-label" style={{ margin: 0 }}>Seleccionar Tarjeta Registrada</label>
                            {selectedCardId !== 'manual' && (
                              <button
                                type="button"
                                onClick={() => handleEliminarTarjeta(selectedCardId)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.78rem'
                                }}
                                title="Eliminar tarjeta guardada"
                              >
                                <Trash2 size={13} /> Eliminar tarjeta
                              </button>
                            )}
                          </div>
                          <select
                            className="form-input"
                            value={selectedCardId}
                            onChange={(e) => setSelectedCardId(e.target.value)}
                          >
                            {user.tarjetas.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.brand} terminada en •••• {c.last4} (Vence {c.exp})
                              </option>
                            ))}
                            <option value="manual">Usar otra tarjeta distinta...</option>
                          </select>
                        </div>
                      )}

                      {selectedCardId === 'manual' || !user?.tarjetas?.length ? (
                        <>
                          <div className="form-group">
                            <label className="form-label">Número de tarjeta</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="4532 0000 0000 4242"
                              maxLength={19}
                              value={cardNumber}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setCardNumber(val.match(/.{1,4}/g)?.join(' ') || val);
                              }}
                              required={paymentMethod === 'payklik'}
                            />
                          </div>
                          <div className="form-row-2">
                            <div className="form-group">
                              <label className="form-label">Vencimiento</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="MM/AA"
                                maxLength={5}
                                value={expiry}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/\D/g, '');
                                  if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                  setExpiry(val);
                                }}
                                required={paymentMethod === 'payklik'}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">CVV</label>
                              <input
                                type="password"
                                className="form-input"
                                placeholder="•••"
                                maxLength={4}
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value)}
                                required={paymentMethod === 'payklik'}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="form-row-2" style={{ marginTop: '0.5rem' }}>
                          <div className="form-group">
                            <label className="form-label">Código de Seguridad (CVV)</label>
                            <input
                              type="password"
                              className="form-input"
                              placeholder="•••"
                              maxLength={4}
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value)}
                              required={paymentMethod === 'payklik'}
                            />
                          </div>
                          <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span>Protegido con tokenización segura</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bank Transfer */}
                <div className={`payment-method-card ${paymentMethod === 'transferencia' ? 'selected' : ''}`}>
                  <label className="payment-method-header">
                    <div className="payment-radio-group">
                      <input
                        type="radio"
                        name="payment"
                        value="transferencia"
                        checked={paymentMethod === 'transferencia'}
                        onChange={() => setPaymentMethod('transferencia')}
                      />
                      <Building2 size={24} className="method-icon" />
                      <div>
                        <div className="method-name">Transferencia Bancaria Directa</div>
                        <div className="method-desc">Acreditación automática inmediata</div>
                      </div>
                    </div>
                    {paymentMethod === 'transferencia' && <CheckCircle2 size={20} className="check-active" />}
                  </label>
                </div>

                {/* Digital Wallet */}
                <div className={`payment-method-card ${paymentMethod === 'billetera' ? 'selected' : ''}`}>
                  <label className="payment-method-header">
                    <div className="payment-radio-group">
                      <input
                        type="radio"
                        name="payment"
                        value="billetera"
                        checked={paymentMethod === 'billetera'}
                        onChange={() => setPaymentMethod('billetera')}
                      />
                      <Wallet size={24} className="method-icon" />
                      <div>
                        <div className="method-name">Billetera Digital Omnicanal</div>
                        <div className="method-desc">Pago express con saldo registrado</div>
                      </div>
                    </div>
                    {paymentMethod === 'billetera' && <CheckCircle2 size={20} className="check-active" />}
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="checkout-summary-col">
            <div className="checkout-summary-card glass-panel">
              <h3>Resumen del Pedido</h3>

              {/* Items List Snapshot */}
              <div className="checkout-items-preview">
                {cartItems.map(item => (
                  <div key={item.id} className="checkout-item-row">
                    <img src={item.imagen} alt={item.nombre} />
                    <div className="item-details">
                      <span className="item-name">{item.nombre}</span>
                      <span className="item-qty">Cant: {item.cantidad}</span>
                    </div>
                    <span className="item-price">${(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Summary Totals */}
              <div className="summary-breakdown">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Impuestos (12% IVA SAT)</span>
                  <span>${taxes.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Envío ({deliveryType === 'domicilio' ? 'Express' : 'En tienda'})</span>
                  <span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-total-row">
                  <span className="total-label">Total a Pagar</span>
                  <span className="total-amount">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleConfirmPurchase}
                className="btn-primary btn-block btn-confirm-pay"
                disabled={loading || cartItems.length === 0}
              >
                <Lock size={18} />
                <span>
                  {loading
                    ? (paymentMethod === 'credito_propio' ? 'Procesando crédito...' : 'Procesando con PayKlik...')
                    : (paymentMethod === 'credito_propio' ? 'Confirmar Compra con Crédito Propio (Paga en 30 días)' : 'Confirmar y pagar')}
                </span>
              </button>

              <p className="checkout-terms-note">
                Al hacer clic en "Confirmar y pagar", autorizas el procesamiento de la orden y aceptas nuestros Términos y Condiciones.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};
