import dynamic from "next/dynamic";
import HeroLcpShell from "@/components/guest/HeroLcpShell";
import HomeHeroClient from "@/components/guest/HomeHeroClient";
import WhatIsTycoon from "@/components/guest/WhatIsTycoon";
import JoinOurCommunity from "@/components/guest/JoinOurCommunity";
import Footer from "@/components/shared/Footer";

const HowItWorks = dynamic(() => import("@/components/guest/HowItWorks"), {
  loading: () => <div className="min-h-[400px] w-full bg-[#010F10]" aria-hidden />,
});

export default function Home() {
  return (
    <main className="w-full">
      <div className="relative min-h-[100dvh] w-full">
        <HeroLcpShell />
        <HomeHeroClient />
      </div>
      <WhatIsTycoon />
      <HowItWorks />
      <JoinOurCommunity />
      <Footer />
    </main>
  );
}
