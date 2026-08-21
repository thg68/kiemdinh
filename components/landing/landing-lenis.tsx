"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function LandingLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      anchors: {
        offset: -84,
      },
      autoRaf: true,
      duration: 1,
      easing: (time) => Math.min(1, 1.001 - 2 ** (-10 * time)),
      stopInertiaOnNavigate: true,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
}
