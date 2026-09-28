import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Store, CreditCard, Building2, Wallet, ArrowLeft, Lock, CheckCircle2, Shield } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { crearOrden } from '../services/api';

export const CheckoutPage = () => {
  const { cartItems, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    }
  }, [user, navigate]);

  const [deliveryType, setDeliveryType] = useState('domicilio');
  const [paymentMethod, setPaymentMethod] = useState('payklik');
  const [loading, setLoading] = useState(false);

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

  const handleConfirmPurchase = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      navigate('/catalogo');
      return;
    }

    setLoading(true);
    try {
      const order = await crearOrden(
        cartItems,
        { clienteId: user?.id || '1', nombreCompleto: fullName, telefono: phone, direccion: address, tipoEntrega: deliveryType },
        { metodo: paymentMethod }
      );
      if (order?.id) {
        localStorage.setItem('lastOrder', order.id);
      }
      clearCart();
      navigate(`/confirmacion/${order.id}`);
    } catch (err) {
      console.error('Checkout error:', err);
      alert(err.message || 'Hubo un problema al procesar tu compra. Por favor intenta de nuevo.');
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
                          <label className="form-label">Seleccionar Tarjeta Registrada</label>
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
                              onChange={(e) => setCardNumber(e.target.value)}
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
                                onChange={(e) => setExpiry(e.target.value)}
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
                <span>{loading ? 'Procesando con PayKlik...' : 'Confirmar y pagar'}</span>
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
