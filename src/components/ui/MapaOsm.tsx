import { cn } from "@/lib/utils";

interface Props {
  lat: number;
  lng: number;
  /** Radio aproximado visible alrededor del punto, en metros */
  radioM?: number;
  titulo: string;
  className?: string;
}

/** Mapa de OpenStreetMap embebido (sin librerías ni clave) con un marcador. */
export function MapaOsm({ lat, lng, radioM = 400, titulo, className }: Props) {
  const dLat = radioM / 111_320;
  const dLng = radioM / (111_320 * Math.cos((lat * Math.PI) / 180));
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].map((n) => n.toFixed(5)).join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)},${lng.toFixed(6)}`;

  return (
    <iframe
      src={src}
      title={titulo}
      loading="lazy"
      className={cn("w-full rounded-lg border border-border bg-surface-2", className)}
    />
  );
}
