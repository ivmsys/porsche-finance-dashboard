import React, { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal: muestra su contenido con una animación cuando entra al viewport.
 * Props: children, className, rootMargin, threshold
 */
function ScrollReveal({ children, className = '', rootMargin = '0px 0px -10% 0px', threshold = 0.15 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      });
    }, { root: null, rootMargin, threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  );
}

export default ScrollReveal;