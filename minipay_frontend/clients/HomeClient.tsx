"use client";

import dynamic from "next/dynamic";
import HeroSection from "@/components/guest/HeroSection";

const HowItWorks = dynamic(() => import("@/components/guest/HowItWorks"), {
  loading: () => (
    <div className="min-h-[856px] w-full bg-[#010F10]" aria-hidden />
  ),
});

const WhatIsTycoon = dynamic(() => import("@/components/guest/WhatIsTycoon"), {
  loading: () => <div className="min-h-[480px] w-full bg-[#010F10]" aria-hidden />,
});

const JoinOurCommunity = dynamic(() => import("@/components/guest/JoinOurCommunity"), {
  loading: () => <div className="min-h-[320px] w-full bg-[#010F10]" aria-hidden />,
});

const Footer = dynamic(() => import("@/components/shared/Footer"), {
  loading: () => <div className="min-h-[120px] w-full bg-[#010F10]" aria-hidden />,
});

export default function HomeClient() {
  return (
    <main className="w-full">
      <HeroSection />
      <WhatIsTycoon />
      <HowItWorks />
      <JoinOurCommunity />
      <Footer />
    </main>
  );
}
