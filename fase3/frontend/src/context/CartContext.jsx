import React, { createContext, useContext, useState, useEffect } from 'react';
import { sincronizarCarritoTemporal, limpiarCarritoTemporal } from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('sgologic_cart');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('sgologic_cart', JSON.stringify(cartItems));
    try {
      const savedUser = localStorage.getItem('sgologic_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const cid = parsed?.id || parsed?.email;
        if (cid) {
          if (cartItems.length > 0) {
            sincronizarCarritoTemporal(cid, cartItems);
          } else {
            limpiarCarritoTemporal(cid);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    if (typeof product?.stock === 'number' && product.stock <= 0) {
      return; // No agregar productos agotados
    }
    const maxStock = typeof product?.stock === 'number' && product.stock > 0 ? product.stock : 25;
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const limit = existing.maxStock || maxStock;
        const nextQty = Math.min(limit, existing.cantidad + quantity);
        return prev.map(item =>
          item.id === product.id
            ? { ...item, cantidad: nextQty, maxStock: limit }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          nombre: product.nombre,
          descripcion: product.descripcion,
          precio: product.precio,
          cantidad: Math.min(maxStock, quantity),
          maxStock,
          imagen: product.imagen,
          stockStatus: product.tag || 'En stock'
        }
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, cantidad) => {
    if (cantidad <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => {
        if (item.id !== productId) return item;
        const limit = item.maxStock || 25;
        return { ...item, cantidad: Math.min(limit, cantidad) };
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalCount = cartItems.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

