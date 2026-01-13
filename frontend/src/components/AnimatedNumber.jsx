import { useEffect, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function AnimatedNumber({ value, durationMs = 1200, decimals = 0, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const start = 0;
    const end = Number(value) || 0;
    const duration = Math.max(300, durationMs);
    const formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const progress = clamp((ts - startRef.current) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = start + (end - start) * eased;
      if (mountedRef.current) setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      mountedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [value, durationMs, decimals]);

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span>
      {formatter.format(display)}{suffix}
    </span>
  );
}


