import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const agotado = typeof product.stock === 'number' && product.stock <= 0;

  const handleAdd = () => {
    if (agotado) return;
    if (!user) {
      navigate('/login?redirect=/catalogo');
      return;
    }
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
      <div className="product-image-wrapper">
        <img 
          src={product.imagen || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'} 
          alt={product.nombre} 
          className="product-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <span className={`product-badge badge ${agotado ? 'badge-error' : getTagClass(product.tagType)}`}>
          {agotado ? 'Agotado' : (product.tag || 'Disponible')}
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
            disabled={agotado}
            className={`btn-add-cart ${added ? 'added' : ''}`}
            style={agotado ? { opacity: 0.5, cursor: 'not-allowed', background: '#475569', borderColor: '#64748b' } : {}}
            aria-label={agotado ? 'Producto agotado' : 'Agregar al carrito'}
            title={agotado ? 'Sin existencias en almacén' : 'Agregar producto al carrito'}
          >
            {added ? (
              <>
                <Check size={18} />
                <span className="btn-text">¡Agregado!</span>
              </>
            ) : agotado ? (
              <span className="btn-text" style={{ color: '#cbd5e1' }}>Agotado</span>
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
