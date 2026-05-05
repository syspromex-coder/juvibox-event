import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jubivox Admin",
    short_name: "Jubivox",
    description: "Administración de Jubivox Party Rentals",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdf2f8", // brand-50 (rosa muy claro)
    theme_color: "#ec4899", // rosa Jubivox
    lang: "es-MX",
    categories: ["business", "productivity"],
    icons: [
      // Logo Jubivox como ícono principal
      {
        src: "/logo-square.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Maskable: con safe-area para Android
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Nuevo evento",
        short_name: "Evento",
        url: "/eventos/nuevo",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Nuevo pago",
        short_name: "Pago",
        url: "/pagos/nuevo",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
