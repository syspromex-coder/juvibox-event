import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import AuthSessionProvider from "@/components/layout/AuthSessionProvider";
import AppShell from "@/components/layout/AppShell";
import { SettingsProvider } from "@/lib/settings";
import { getServerLang } from "@/lib/i18n-server";
import "./globals.css";

const APP_NAME = "Jubivox Admin";
const APP_DESC = "Administración de Jubivox Party Rentals";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: { default: APP_NAME, template: "%s · Jubivox" },
  description: APP_DESC,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = getServerLang();
  // Pre-cargar la sesión en el server para hidratar el cliente sin parpadeo.
  const session = await getServerSession(authOptions);

  return (
    <html lang={lang}>
      <body className="bg-slate-50 text-slate-900">
        <AuthSessionProvider session={session}>
          <SettingsProvider>
            <ServiceWorkerRegister />
            <AppShell>{children}</AppShell>
          </SettingsProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
