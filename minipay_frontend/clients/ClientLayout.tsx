"use client";

import dynamic from "next/dynamic";
import NavBarMobile from "@/components/shared/navbar-mobile";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { dmSans, kronaOne, orbitron } from "@/components/shared/fonts";
import { isPublicPath } from "@/lib/publicPaths";

const ProfileProvider = dynamic(
  () => import("@/context/ProfileContext").then((m) => ({ default: m.ProfileProvider })),
  { ssr: false }
);
const AuthGuard = dynamic(() => import("@/components/auth/AuthGuard"), { ssr: false });

interface ClientLayoutProps {
  children: ReactNode;
  cookies?: string | null;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [providersReady, setProvidersReady] = useState(false);
  const pathname = usePathname();
  const isBoard3D = pathname === "/board-3d-mobile" || pathname === "/board-3d-multi-mobile";
  const isPublic = isPublicPath(pathname ?? "");
  const needsMobileNavPadding = !isBoard3D;
  const contentClassName = [
    needsMobileNavPadding ? "pt-below-mobile-nav" : "",
    !isBoard3D ? "max-w-md mx-auto w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    setProvidersReady(true);
  }, []);

  const pageContent = (
    <div className={contentClassName || undefined}>{children}</div>
  );

  const layoutShell = (
    <div suppressHydrationWarning className={`${orbitron.variable} ${dmSans.variable} ${kronaOne.variable}`}>
      {isBoard3D ? (
        <NavBarMobile minimal />
      ) : (
        <div className="max-w-md mx-auto w-full">
          <NavBarMobile />
        </div>
      )}
      {providersReady && !isPublic ? <AuthGuard>{pageContent}</AuthGuard> : pageContent}
    </div>
  );

  if (!providersReady) return layoutShell;

  return <ProfileProvider>{layoutShell}</ProfileProvider>;
}
