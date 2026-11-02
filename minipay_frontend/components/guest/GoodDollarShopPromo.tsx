"use client";

import Link from "next/link";
import { Coins, ArrowRight } from "lucide-react";
import { GOODDOLLAR_SYMBOL } from "@/lib/shop/goodDollarPayment";

const GoodDollarShopPromo = () => {
  return (
    <section className="w-full relative px-4 py-6 bg-[#010F10]">
      <div className="w-full mx-auto rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent backdrop-blur-sm px-5 py-5 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" aria-hidden />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-300/40 flex items-center justify-center">
              <Coins className="text-emerald-300" size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm leading-snug">
                Spend {GOODDOLLAR_SYMBOL} in the Shop
              </h3>
              <p className="text-slate-300/90 text-xs mt-1 leading-snug">
                Pay for perks with GoodDollar from your MiniPay wallet.
              </p>
            </div>
          </div>
          <Link
            href="/game-shop"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-semibold text-xs px-3.5 py-2.5 active:brightness-110"
          >
            Open shop
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default GoodDollarShopPromo;
