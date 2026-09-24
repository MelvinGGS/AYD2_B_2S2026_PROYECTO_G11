import React from 'react';
import { CheckCircle2, Clock, PackageCheck, Truck, Home, Receipt } from 'lucide-react';

export const OrderTimeline = ({ timeline = [] }) => {
  const getIcon = (estado) => {
    switch (estado) {
      case 'CREADA': return <Receipt size={20} />;
      case 'PAGADA': return <CheckCircle2 size={20} />;
      case 'FACTURADA': return <Receipt size={20} />;
      case 'EN_PREPARACION': return <PackageCheck size={20} />;
      case 'EN_TRANSITO': return <Truck size={20} />;
      case 'ENTREGADA': return <Home size={20} />;
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
          
          return (
            <div 
              key={idx} 
              className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
            >
              {/* Step Icon Node */}
              <div className="step-node">
                {getIcon(step.estado)}
              </div>

              {/* Step Content */}
              <div className="step-content">
                <div className="step-header">
                  <h4 className="step-title">{step.titulo}</h4>
                  {isActive && <span className="active-pulse-badge">En curso</span>}
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
