import React from 'react';
import ScrollReveal from './ScrollReveal';

function Header({ theme, onToggle }) {
  const next = theme === 'dark' ? 'Claro' : 'Oscuro';
  const logoSrc = `${process.env.PUBLIC_URL}/porsche-logo.png`;
  const fallbackSrc = `${process.env.PUBLIC_URL}/logo192.png`;
  return (
    <ScrollReveal>
      <div className="header">
        <div className="brand">
          <img
            src={logoSrc}
            alt="Porsche"
            className="logo"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackSrc;
            }}
          />
          <span className="brand-title">PORSCHE Finance Dashboard</span>
        </div>
        <div className="header-actions">
          <button className="toggle" onClick={onToggle}>
            Tema: {theme.charAt(0).toUpperCase() + theme.slice(1)} (Cambiar a {next})
          </button>
        </div>
      </div>
    </ScrollReveal>
  );
}

export default Header;