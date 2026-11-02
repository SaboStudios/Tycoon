"use client";

import { Coins, ExternalLink } from "lucide-react";
import { GOODDOLLAR_SYMBOL } from "@/lib/shop/goodDollarPayment";

const WEB_SHOP_URL = "https://www.playtycoon.xyz/game-shop";

const GoodDollarShopPromo = () => {
  return (
    <section className="w-full px-4 py-3 bg-[#010F10]">
      <a
        href={WEB_SHOP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs active:brightness-110"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Coins className="text-emerald-300/90 shrink-0" size={14} />
          <span className="text-slate-300/90 truncate">
            Want to pay in {GOODDOLLAR_SYMBOL}? Shop on the web.
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-emerald-300 font-medium shrink-0">
          playtycoon.xyz
          <ExternalLink size={12} />
        </span>
      </a>
    </section>
  );
};

export default GoodDollarShopPromo;
