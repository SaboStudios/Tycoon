"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import WhatIsTycoon from "@/components/guest/WhatIsTycoon";
import JoinOurCommunity from "@/components/guest/JoinOurCommunity";
import Footer from "@/components/shared/Footer";

const HeroSection = dynamic(() => import("@/components/guest/HeroSection"), {
  loading: () => null,
});

const HowItWorks = dynamic(() => import("@/components/guest/HowItWorks"), {
  loading: () => (
    <div className="min-h-[856px] w-full bg-[#010F10]" aria-hidden />
  ),
});

interface HomeClientProps {
  staticHero?: ReactNode;
}

export default function HomeClient({ staticHero }: HomeClientProps) {
  const reuseStaticVisuals = !!staticHero;

  return (
    <main className="grid w-full grid-cols-1">
      {staticHero ? (
        <div className="col-start-1 row-start-1 min-h-screen">{staticHero}</div>
      ) : null}

      <div className="col-start-1 row-start-1 z-10 min-h-screen">
        <HeroSection reuseStaticVisuals={reuseStaticVisuals} />
      </div>

      <div className="col-start-1 row-start-2">
        <WhatIsTycoon />
        <HowItWorks />
        <JoinOurCommunity />
        <Footer />
      </div>
    </main>
  );
}
