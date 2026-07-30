import React from 'react';

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
}) => {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      disabled={disabled || loading}
      onClick={onClick}
      type="button"
    >
      {loading && <span className="btn__spinner" />}
      {label}
    </button>
  );
};

export default Button;
