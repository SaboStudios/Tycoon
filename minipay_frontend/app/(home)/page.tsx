import HomeClient from "@/clients/HomeClient";
import HomeHeroStatic from "@/components/guest/HomeHeroStatic";

export default function Home() {
  return (
    <div className="relative w-full">
      <HomeHeroStatic />
      <div className="relative z-10">
        <HomeClient />
      </div>
    </div>
  );
}