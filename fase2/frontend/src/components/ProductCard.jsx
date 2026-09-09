import React, { useState } from 'react';
import { ShoppingCart, Check, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const getTagClass = (type) => {
    switch (type) {
      case 'error': return 'badge-error';
      case 'info': return 'badge-info';
      default: return 'badge-orange';
    }
  };

  return (
    <div className="product-card glass-panel">
      {/* Product Image Container */}
      <div className="product-image-wrapper">
        <img src={product.imagen} alt={product.nombre} className="product-image" />
        <span className={`product-badge badge ${getTagClass(product.tagType)}`}>
          {product.tag}
        </span>
        {product.rating && (
          <div className="rating-badge">
            <Star size={12} className="star-icon" />
            <span>{product.rating}</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="product-info">
        <span className="product-category">{product.categoria}</span>
        <h3 className="product-title" title={product.nombre}>{product.nombre}</h3>
        <p className="product-desc">{product.descripcion}</p>

        {/* Pricing & CTA */}
        <div className="product-footer">
          <div className="price-container">
            <span className="current-price">${product.precio.toFixed(2)}</span>
            {product.precioAnterior && (
              <span className="old-price">${product.precioAnterior.toFixed(2)}</span>
            )}
          </div>

          <button
            onClick={handleAdd}
            className={`btn-add-cart ${added ? 'added' : ''}`}
            aria-label="Agregar al carrito"
          >
            {added ? (
              <>
                <Check size={18} />
                <span className="btn-text">¡Agregado!</span>
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                <span className="btn-text">Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
