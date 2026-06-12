import type { ReactNode } from "react";
import HomeClient from "@/clients/HomeClient";
import HomeHeroStatic from "@/components/guest/HomeHeroStatic";

export default function Home() {
  const staticHero: ReactNode = <HomeHeroStatic />;

  return <HomeClient staticHero={staticHero} />;
}
