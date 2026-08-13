"use client";

import { ReactLenis } from "lenis/react";

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactLenis root options={{ lerp: 0.05, wheelMultiplier: 1.0, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
