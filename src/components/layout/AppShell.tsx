"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import MobileHeader from "./MobileHeader";
import CurrencyBanner from "@/components/ui/CurrencyBanner";

/**
 * En las rutas de auth (ej. /login) renderizamos solo los children sin sidebar/nav.
 * En todas las demás, el chrome completo de la app.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <main
          className="flex min-w-0 flex-1 flex-col"
          style={{
            // Fondo Juvibox con overlay blanco al 85% para legibilidad.
            // El gradient semi-transparente va ENCIMA de la imagen (CSS apila
            // backgrounds de izquierda-arriba a derecha-abajo), simulando un
            // overlay blanco sin necesidad de un <div> extra.
            // Solo se aplica a <main>: el <Sidebar> es hermano y no se ve afectado.
            // /login no usa AppShell, así que tampoco recibe este fondo.
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url('/images/background-juvibox.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <MobileHeader />
          <CurrencyBanner />
          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-bottom-nav sm:px-6 sm:py-6 lg:py-8 lg:pb-10">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
