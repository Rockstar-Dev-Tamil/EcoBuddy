"use client";

import React, { useEffect, useRef } from "react";
import { animate } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  direction?: "up" | "down";
  format?: (val: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  format = (val) => val.toFixed(1),
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  // We use useIsomorphicLayoutEffect if possible, but useEffect is fine for Next.js SSR
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const controls = animate(prevValue.current, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate(v) {
        node.textContent = format(v);
      },
    });

    prevValue.current = value;

    return () => controls.stop();
  }, [value, format]);

  return <span ref={ref} className={className}>{format(value)}</span>;
}
