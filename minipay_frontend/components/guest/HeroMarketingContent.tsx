"use client";

import { TypeAnimation } from "react-type-animation";
import { NeonTitle } from "@/components/hero/NeonTitle";

/** Hero copy — visible on first paint; wallet chunk loads separately below. */
export default function HeroMarketingContent({
  showDescription = true,
}: {
  showDescription?: boolean;
}) {
  return (
    <>
      <div className="mt-4 flex w-full max-w-sm justify-center px-2">
        <TypeAnimation
          sequence={[
            "Conquer",
            1200,
            "Conquer • Build",
            1200,
            "Conquer • Build • Trade",
            1800,
            "Play Solo vs AI",
            2000,
            "Conquer • Build",
            1000,
            "Conquer",
            1000,
            "",
            500,
          ]}
          wrapper="span"
          speed={40}
          repeat={Infinity}
          className="font-orbitron text-[18px] font-[700] text-[#F0F7F7] text-center block leading-snug"
          style={{
            textShadow: "0 0 8px rgba(0, 240, 255, 0.6), 0 0 16px rgba(0, 240, 255, 0.3)",
          }}
        />
      </div>

      <div>
        <NeonTitle text="TYCOON" size="lg" />
      </div>

      <div className="w-full max-w-sm px-2 text-center text-[#F0F7F7] -tracking-[2%]">
        <TypeAnimation
          sequence={[
            "Roll the dice",
            2000,
            "Buy properties",
            2000,
            "Collect rent",
            2000,
            "Play against AI opponents",
            2200,
            "Become the top tycoon",
            2000,
          ]}
          wrapper="span"
          speed={50}
          repeat={Infinity}
          className="font-orbitron text-[16px] font-[700] text-[#F0F7F7] text-center block leading-snug"
          style={{
            textShadow: "0 0 6px rgba(0, 240, 255, 0.5), 0 0 12px rgba(0, 240, 255, 0.2)",
          }}
        />
        <p
          className={`font-dmSans font-[400] text-[13px] text-[#F0F7F7] leading-relaxed text-pretty overflow-hidden transition-[opacity,max-height,margin] duration-500 ease-out ${
            showDescription ? "opacity-100 max-h-48 mt-3" : "opacity-0 max-h-0 mt-0"
          }`}
          aria-hidden={!showDescription}
        >
          Step into Tycoon — the Web3 twist on the classic game of strategy,
          ownership, and fortune. Play solo against AI, collect tokens, complete
          quests, and become the ultimate blockchain tycoon.
        </p>
      </div>
    </>
  );
}
