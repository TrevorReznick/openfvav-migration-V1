import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  elevated?: boolean;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  elevated = false,
  children,
}) => {
  return (
    <div className={`card ${elevated ? 'card--elevated' : ''}`}>
      {title && <h3 className="card__title">{title}</h3>}
      {subtitle && <p className="card__subtitle">{subtitle}</p>}
      <div className="card__body">{children}</div>
    </div>
  );
};

export default Card;
