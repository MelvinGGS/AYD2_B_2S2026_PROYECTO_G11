import React, { useState } from 'react';
import { X, User, Phone, MapPin, CreditCard, ShieldCheck, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { actualizarPerfilCliente } from '../services/api';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  const [phone, setPhone] = useState(user?.telefono || '');
  const [address, setAddress] = useState(user?.direccion || '');
  const [cards, setCards] = useState(user?.tarjetas || []);

  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExp, setNewCardExp] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    updateProfile({
      telefono: phone,
      direccion: address,
      tarjetas: cards
    });

    if (user.id) {
      try {
        await actualizarPerfilCliente(user.id, {
          nombre: user.nombre,
          telefono: phone,
          direccion: address
        });
      } catch (err) {
        console.warn('No se pudo sincronizar perfil en backend:', err);
      }
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    const cleanNum = newCardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 15) return;
    const last4 = cleanNum.slice(-4);
    const newCard = {
      id: 'card-' + Date.now(),
      last4,
      brand: cleanNum.startsWith('4') ? 'Visa' : cleanNum.startsWith('5') ? 'Mastercard' : 'Amex',
      exp: newCardExp || '12/29',
      holder: newCardHolder || user.nombre
    };
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    updateProfile({ tarjetas: updatedCards });
    setNewCardNumber('');
    setNewCardExp('');
    setNewCardHolder('');
    setShowAddCard(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleRemoveCard = (cardId) => {
    const updatedCards = cards.filter(c => c.id !== cardId);
    setCards(updatedCards);
    updateProfile({ tarjetas: updatedCards });
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="profile-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="icon-badge">
              <User size={20} />
            </div>
            <div>
              <h3>Mi Cuenta y Perfil Omnicanal</h3>
              <p className="modal-subtitle">{user.email}</p>
            </div>
          </div>
          <button className="icon-btn-sm" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {savedSuccess && (
          <div className="status-banner-card text-success" style={{ margin: '0.75rem 0' }}>
            <CheckCircle2 size={18} />
            <span>Datos actualizados correctamente en tu perfil.</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="profile-form">
          {/* Personal Info */}
          <div className="form-section">
            <h4 className="section-title">Datos Personales</h4>
            <div className="form-row-2">
              <div>
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  className="form-input"
                  value={user.nombre || ''}
                  disabled
                />
              </div>
              <div>
                <label className="form-label">Canal Preferido</label>
                <input
                  type="text"
                  className="form-input"
                  value={user.canalPreferido || 'Web Store'}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Contact and Shipping */}
          <div className="form-section">
            <h4 className="section-title">Contacto y Entrega</h4>
            <div className="form-row-2">
              <div>
                <label className="form-label">Teléfono de Contacto</label>
                <div className="input-icon-wrapper">
                  <Phone size={16} className="field-icon" />
                  <input
                    type="text"
                    className="form-input with-icon"
                    placeholder="Ej. +502 5555 1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Dirección de Entrega Predeterminada</label>
                <div className="input-icon-wrapper">
                  <MapPin size={16} className="field-icon" />
                  <input
                    type="text"
                    className="form-input with-icon"
                    placeholder="Ej. Avenida Reforma 12-01, Zona 10, Ciudad de Guatemala"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cards & Wallet Section */}
          <div className="form-section">
            <div className="section-header-row">
              <h4 className="section-title">Billetera y Tarjetas Registradas</h4>
              {!showAddCard && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setShowAddCard(true)}
                >
                  <Plus size={14} />
                  <span>Agregar Tarjeta</span>
                </button>
              )}
            </div>

            <div className="saved-cards-list">
              {cards.length === 0 ? (
                <div className="empty-cards-notice">
                  <p>No tienes tarjetas registradas en tu billetera omnicanal.</p>
                  <p className="sub-text">Haz clic en &quot;Agregar Tarjeta&quot; para registrar un método de pago seguro para tus compras.</p>
                </div>
              ) : (
                cards.map((c) => (
                  <div key={c.id} className="saved-card-item">
                    <div className="card-item-left">
                      <CreditCard size={20} className="icon-orange" />
                      <div>
                        <span className="card-brand">{c.brand} •••• {c.last4}</span>
                        <span className="card-meta">Vence: {c.exp} | Titular: {c.holder}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="icon-btn-danger"
                      onClick={() => handleRemoveCard(c.id)}
                      title="Eliminar tarjeta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Card Subform */}
            {showAddCard && (
              <div className="add-card-subform glass-panel">
                <h5 className="subform-title">Registrar Nueva Tarjeta (PayKlik)</h5>
                <div className="form-row-3">
                  <div>
                    <label className="form-label">Número de Tarjeta</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="4532 0000 0000 4242"
                      maxLength={19}
                      value={newCardNumber}
                      onChange={(e) => setNewCardNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Vencimiento (MM/AA)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="12/28"
                      maxLength={5}
                      value={newCardExp}
                      onChange={(e) => setNewCardExp(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Nombre del Titular</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Como aparece en la tarjeta"
                      value={newCardHolder}
                      onChange={(e) => setNewCardHolder(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="subform-actions">
                  <button type="button" onClick={handleAddCard} className="btn-primary btn-sm">
                    Guardar Tarjeta
                  </button>
                  <button type="button" onClick={() => setShowAddCard(false)} className="btn-secondary btn-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="pci-notice">
              <ShieldCheck size={16} className="icon-orange" />
              <span>
                Cumplimiento PCI-DSS: Los datos sensibles de tarjeta y CVV no se almacenan en texto plano en la base de datos por normativa de seguridad fiscal y auditoría.
              </span>
            </div>
          </div>

          <div className="modal-actions-row">
            <button type="submit" className="btn-primary">
              Guardar Cambios
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
