import Image from "next/image";
import herobg from "@/public/heroBg.png";
import { NeonTitle } from "@/components/hero/NeonTitle";

/**
 * Server-rendered hero snapshot for LCP. Hidden when interactive HeroSection mounts.
 * Matches the hero center layout without changing the live hero UI.
 */
export default function HomeHeroStatic() {
  return (
    <section
      id="home-hero-static"
      aria-hidden="true"
      className="absolute inset-0 z-0 w-full h-screen overflow-hidden bg-[#010F10] pointer-events-none"
    >
      <Image
        src={herobg}
        alt=""
        className="w-full h-full object-cover"
        width={1440}
        height={1024}
        priority
        fetchPriority="high"
        sizes="(max-width: 768px) 100vw, 1440px"
        quality={75}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#010F10]/20 to-[#010F10]/60" />

      <div className="absolute top-0 left-0 z-10 flex h-full w-full flex-col items-center justify-start gap-1 px-4 pt-8">
        <div className="mt-4 flex justify-center items-center gap-3" style={{ overflow: "visible", whiteSpace: "nowrap" }}>
          <span
            className="font-orbitron text-[20px] font-[700] text-[#F0F7F7] text-center block"
            style={{
              textShadow: "0 0 8px rgba(0, 240, 255, 0.6), 0 0 16px rgba(0, 240, 255, 0.3)",
            }}
          >
            Conquer
          </span>
        </div>

        <NeonTitle text="TYCOON" size="lg" />

        <div className="w-full px-4 text-center text-[#F0F7F7] -tracking-[2%]" style={{ overflow: "visible", whiteSpace: "nowrap" }}>
          <span
            className="font-orbitron text-[18px] font-[700] text-[#F0F7F7] text-center block"
            style={{
              textShadow: "0 0 6px rgba(0, 240, 255, 0.5), 0 0 12px rgba(0, 240, 255, 0.2)",
            }}
          >
            Roll the dice
          </span>
          <p className="font-dmSans font-[400] text-[13px] text-[#F0F7F7] mt-3 leading-relaxed">
            Step into Tycoon — the Web3 twist on the classic game of strategy,
            ownership, and fortune. Play solo against AI, compete in multiplayer
            rooms, collect tokens, complete quests, and become the ultimate
            blockchain tycoon.
          </p>
        </div>
      </div>
    </section>
  );
}
