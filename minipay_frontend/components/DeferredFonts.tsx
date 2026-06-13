"use client";

import { useEffect } from "react";
import { dmSans, kronaOne, orbitron } from "@/components/shared/fonts";

/** Google font CSS loads with this chunk — not on the LCP critical path. */
export default function DeferredFonts() {
  useEffect(() => {
    const classes = [dmSans.variable, kronaOne.variable, orbitron.variable].filter(Boolean);
    document.body.classList.add(...classes);
  }, []);

  return null;
}
