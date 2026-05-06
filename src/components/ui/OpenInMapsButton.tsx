import { FiMapPin } from "react-icons/fi";
import { buildMapsUrl } from "@/lib/utils";

type Props = {
  /** Ubicación: dirección, link de Google Maps, o ubicación compartida. */
  location: string | null | undefined;
  /** Texto del botón. Default: "Abrir en Maps". */
  label?: string;
  /** Clase CSS extra para el botón. Default: btn-secondary btn-sm */
  className?: string;
};

/**
 * Botón que abre una ubicación en Google Maps en una pestaña nueva.
 *
 * - Si `location` ya es una URL (http/https), abre ese link directo.
 * - Si es texto libre, lo busca en Google Maps con &api=1.
 * - Si `location` está vacío o es null, NO renderiza nada (devuelve null),
 *   así no aparece un botón muerto en eventos sin ubicación.
 *
 * Implementado como `<a target="_blank">` puro — no necesita JS, funciona
 * igual en server y client components.
 */
export default function OpenInMapsButton({
  location,
  label = "Abrir en Maps",
  className = "btn-secondary btn-sm inline-flex items-center justify-center gap-1.5",
}: Props) {
  const url = buildMapsUrl(location);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <FiMapPin className="h-[18px] w-[18px]" aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}
