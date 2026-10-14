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
import { GlobalHelpWidget } from './components/GlobalHelpWidget';

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
            <Route path="/confirmacion" element={<ConfirmacionPage />} />
            <Route path="/seguimiento/:ordenId" element={<SeguimientoPage />} />
            <Route path="/seguimiento" element={<SeguimientoPage />} />
            <Route path="/pedidos/:ordenId" element={<SeguimientoPage />} />
            <Route path="/pedidos" element={<SeguimientoPage />} />
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <GlobalHelpWidget />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
