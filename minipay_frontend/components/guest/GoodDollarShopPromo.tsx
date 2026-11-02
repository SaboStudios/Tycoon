"use client";

import Link from "next/link";
import { Coins, Sparkles, ArrowRight } from "lucide-react";
import { GOODDOLLAR_SYMBOL } from "@/lib/shop/goodDollarPayment";

const Item = () => (
  <span className="inline-flex items-center gap-2 px-5 whitespace-nowrap">
    <Coins className="text-emerald-300" size={16} />
    <span className="text-emerald-200 font-semibold text-sm">
      New: Buy perks with {GOODDOLLAR_SYMBOL}
    </span>
    <Sparkles className="text-emerald-300/80" size={14} />
    <span className="text-slate-300/90 text-sm">
      Pay from your MiniPay wallet in GoodDollar
    </span>
    <span className="text-emerald-300/60">•</span>
  </span>
);

const GoodDollarShopPromo = () => {
  return (
    <section className="w-full relative px-4 py-5 bg-[#010F10]">
      <Link
        href="/game-shop"
        className="block relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 active:brightness-110"
        aria-label={`Buy perks with ${GOODDOLLAR_SYMBOL} — open shop`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#010F10] to-transparent z-10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#010F10] to-transparent z-10"
        />
        <div className="flex items-center">
          <div className="flex-1 min-w-0 py-3 overflow-hidden">
            <div className="gd-marquee-track flex w-max">
              <div className="flex items-center">
                <Item />
                <Item />
                <Item />
                <Item />
              </div>
              <div className="flex items-center" aria-hidden>
                <Item />
                <Item />
                <Item />
                <Item />
              </div>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 pr-4 pl-2 relative z-20">
            <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-semibold text-xs px-3 py-2">
              Open shop
              <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </Link>
      <style>{`
        @keyframes gd-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .gd-marquee-track {
          animation: gd-marquee 22s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .gd-marquee-track { animation: none; }
        }
      `}</style>
    </section>
  );
};

export default GoodDollarShopPromo;
