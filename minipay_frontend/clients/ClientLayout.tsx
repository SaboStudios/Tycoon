"use client";

import dynamic from "next/dynamic";
import NavBarMobile from "@/components/shared/navbar-mobile";
import { ProfileProvider } from "@/context/ProfileContext";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isPublicPath } from "@/lib/publicPaths";

const AuthGuard = dynamic(() => import("@/components/auth/AuthGuard"), { ssr: false });

interface ClientLayoutProps {
  children: ReactNode;
  cookies?: string | null;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isBoard3D = pathname === "/board-3d-mobile" || pathname === "/board-3d-multi-mobile";
  /** Create Game owns its own header (Close / Tycoon / Support) — no global nav chrome. */
  const isCreateGameSetup = !!pathname && pathname.startsWith("/game-settings");
  const isPublic = isPublicPath(pathname ?? "");
  const needsMobileNavPadding = !isBoard3D && !isCreateGameSetup;
  const contentClassName = [
    needsMobileNavPadding ? "pt-below-mobile-nav" : "",
    !isBoard3D ? "max-w-md mx-auto w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const pageContent = (
    <div className={contentClassName || undefined}>{children}</div>
  );

  return (
    <ProfileProvider>
      <div suppressHydrationWarning>
        {isBoard3D ? (
          <NavBarMobile minimal />
        ) : isCreateGameSetup ? null : (
          <div className="max-w-md mx-auto w-full">
            <NavBarMobile />
          </div>
        )}
        {isPublic ? pageContent : <AuthGuard>{pageContent}</AuthGuard>}
      </div>
    </ProfileProvider>
  );
}
