"use client";

import dynamic from "next/dynamic";

const HeroSection = dynamic(() => import("@/components/guest/HeroSection"), {
  ssr: false,
  loading: () => null,
});

/** Wallet + CTA layer over the server-rendered HeroLcpShell. */
export default function HomeHeroClient() {
  return (
    <div className="absolute inset-0 z-[1]">
      <HeroSection overlayMode />
    </div>
  );
}
