import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import { LoginPage } from './pages/LoginPage';
import { CatalogoPage } from './pages/CatalogoPage';
import { CarritoPage } from './pages/CarritoPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ConfirmacionPage } from './pages/ConfirmacionPage';
import { SeguimientoPage } from './pages/SeguimientoPage';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CatalogoPage />} />
            <Route path="/catalogo" element={<CatalogoPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/carrito" element={<CarritoPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/confirmacion/:ordenId" element={<ConfirmacionPage />} />
            <Route path="/confirmacion" element={<Navigate to="/confirmacion/ORD-2026-08941" replace />} />
            <Route path="/seguimiento/:ordenId" element={<SeguimientoPage />} />
            <Route path="/seguimiento" element={<Navigate to="/seguimiento/ORD-2026-08941" replace />} />
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
