import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturo un error en render:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main, #0b0f17)',
          padding: '2rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: 500,
            width: '100%',
            padding: '2.5rem',
            textAlign: 'center',
            borderRadius: '16px'
          }}>
            <div style={{ color: '#ef4444', marginBottom: '1.25rem' }}>
              <AlertTriangle size={54} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main, #fff)' }}>
              Se produjo un problema al cargar la vista
            </h2>
            <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '1.5rem', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Ocurrió un error inesperado al renderizar este módulo. Puedes intentar recargar la aplicación o volver al inicio.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RefreshCw size={16} /> Recargar Página
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="btn-secondary"
              >
                Ir a la Tienda
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
