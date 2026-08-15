import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
  onClick,
}) => {
  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div
      id="naviq-brand-logo"
      onClick={onClick}
      className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap');
      `}</style>
      <span 
        style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '0.05em', transform: 'scaleX(1.1)', display: 'inline-block' }}
        className={`text-white font-extrabold ${textSizes[size]}`}
      >
        NAVIQ
      </span>
    </div>
  );
};
