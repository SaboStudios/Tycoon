import { NeonTitle } from "@/components/hero/NeonTitle";

/**
 * Server-rendered hero shell — paints TYCOON in the first HTML response (mobile LCP).
 * Interactive wallet UI loads in HomeHeroClient on top of this shell.
 */
export default function HeroLcpShell() {
  return (
    <div
      className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#010F10] px-4"
    >
      <p
        className="mb-3 text-center font-orbitron text-base font-bold text-[#F0F7F7] sm:text-lg"
        style={{ textShadow: "0 0 8px rgba(0, 240, 255, 0.6)" }}
      >
        Conquer • Build • Trade On-chain
      </p>
      <NeonTitle text="TYCOON" size="mobile" />
      <p className="mt-4 max-w-xs text-center font-dmSans text-sm text-[#E0F7F8]/90">
        Roll the dice • Buy properties • Collect rent
      </p>
    </div>
  );
}
