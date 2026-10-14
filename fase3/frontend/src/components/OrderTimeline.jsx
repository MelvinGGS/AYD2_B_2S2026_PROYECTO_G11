import React from 'react';
import { CheckCircle2, Clock, PackageCheck, Truck, Home, Receipt, AlertTriangle, XCircle } from 'lucide-react';

export const OrderTimeline = ({ timeline = [] }) => {
  const getIcon = (estado) => {
    switch (estado) {
      case 'CREADA': return <Receipt size={20} />;
      case 'PAGADA': return <CheckCircle2 size={20} />;
      case 'FACTURADA': return <Receipt size={20} />;
      case 'EN_PREPARACION': return <PackageCheck size={20} />;
      case 'EN_TRANSITO': return <Truck size={20} />;
      case 'ENTREGADA': return <Home size={20} />;
      case 'INVENTARIO_INSUFICIENTE': return <AlertTriangle size={20} style={{ color: '#ef4444' }} />;
      case 'CANCELADA': return <XCircle size={20} style={{ color: '#ef4444' }} />;
      default: return <Clock size={20} />;
    }
  };

  return (
    <div className="order-timeline-container">
      <div className="timeline-line"></div>
      
      <div className="timeline-steps">
        {timeline.map((step, idx) => {
          const isCompleted = step.completado;
          const isActive = step.activo;
          const isError = step.statusType === 'error' || step.estado === 'INVENTARIO_INSUFICIENTE' || step.estado === 'CANCELADA';
          
          return (
            <div 
              key={idx} 
              className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isError ? 'step-error' : ''}`}
            >
              {/* Step Icon Node */}
              <div className="step-node" style={isError ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)' } : {}}>
                {getIcon(step.estado)}
              </div>

              {/* Step Content */}
              <div className="step-content">
                <div className="step-header">
                  <h4 className="step-title" style={isError ? { color: '#f87171' } : {}}>{step.titulo}</h4>
                  {isError ? (
                    <span className="badge badge-error" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                      {step.estado === 'INVENTARIO_INSUFICIENTE' ? 'Sin Stock' : 'Cancelado'}
                    </span>
                  ) : isActive ? (
                    <span className="active-pulse-badge">En curso</span>
                  ) : null}
                  {step.estado === 'ENTREGADA' && isCompleted && (
                    <span className="completed-badge">Entregado</span>
                  )}
                </div>
                <p className="step-desc">{step.desc}</p>
                {step.fecha && step.fecha !== '-' && (
                  <span className="step-date">{step.fecha}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
