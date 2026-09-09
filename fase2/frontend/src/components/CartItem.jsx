import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './CartItem.css';

export const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item glass-panel">
      {/* Product Image */}
      <div className="cart-item-image">
        <img src={item.imagen} alt={item.nombre} />
      </div>

      {/* Info & Description */}
      <div className="cart-item-details">
        <h4 className="cart-item-title">{item.nombre}</h4>
        <p className="cart-item-desc">{item.descripcion}</p>
        <span className="badge badge-orange cart-item-stock">
          {item.stockStatus || 'En stock'}
        </span>
      </div>

      {/* Quantity & Actions */}
      <div className="cart-item-actions">
        <div className="cart-item-price">
          <span className="unit-price">${(item.precio * item.cantidad).toFixed(2)}</span>
          {item.cantidad > 1 && (
            <span className="each-price">${item.precio.toFixed(2)} c/u</span>
          )}
        </div>

        <div className="quantity-controls">
          <button
            className="qty-btn"
            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
            title="Disminuir cantidad"
          >
            <Minus size={14} />
          </button>
          <span className="qty-value">{item.cantidad}</span>
          <button
            className="qty-btn"
            onClick={() => updateQuantity(item.id, item.cantidad + 1)}
            title="Aumentar cantidad"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          className="btn-remove"
          onClick={() => removeFromCart(item.id)}
          title="Eliminar producto"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
