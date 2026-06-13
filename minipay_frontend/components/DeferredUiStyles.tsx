"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

let deferredStylesLoaded = false;

function loadDeferredStyles() {
  if (deferredStylesLoaded) return;
  deferredStylesLoaded = true;
  void import("@/components/DeferredFonts");
  void import("@/styles/deferred-app.css");
  void import("@/styles/deferred-ui.css");
  void import("@/styles/animations.css");
}

/** App + tw-animate CSS after first paint; eager on route change or interaction. */
export default function DeferredUiStyles() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") {
      loadDeferredStyles();
    }
  }, [pathname]);

  useEffect(() => {
    const ric =
      window.requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 1));
    const cancel =
      window.cancelIdleCallback ?? ((id: number) => window.clearTimeout(id));

    const onIntent = () => loadDeferredStyles();
    window.addEventListener("pointerdown", onIntent, { once: true, passive: true });

    // Home below-fold sections: load soon after paint without blocking LCP.
    const soonMs = pathname === "/" ? 400 : 1500;
    const soonId = window.setTimeout(loadDeferredStyles, soonMs);
    const idleId = ric(loadDeferredStyles, { timeout: soonMs + 600 });
    return () => {
      window.clearTimeout(soonId);
      cancel(idleId as number);
      window.removeEventListener("pointerdown", onIntent);
    };
  }, [pathname]);

  return null;
}
