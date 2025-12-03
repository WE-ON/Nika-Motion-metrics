import React from 'react';
import { COLORS } from '../../constants';

interface CardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, subtitle, children, className = '' }) => {
  return (
    <div 
        className={`rounded-2xl shadow-lg p-6 border border-white/10 backdrop-blur-md ${className}`}
        style={{ backgroundColor: COLORS.backgroundLight }}
    >
      <div className="mb-6">
        <h3 className="text-xl font-medium text-white mb-2">{title}</h3>
        {subtitle && <p className="text-sm opacity-80" style={{ color: COLORS.textDim }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
};

export default Card;