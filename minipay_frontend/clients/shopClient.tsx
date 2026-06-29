"use client";

import GameShopMobile from "@/components/shop/shop-mobile";
import PageNoticeBanner from "@/components/ui/PageNoticeBanner";

export default function ShopClient() {
  return (
    <main className="w-full">
      <GameShopMobile />
      <PageNoticeBanner />
    </main>
  );
}
