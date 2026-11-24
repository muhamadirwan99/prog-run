import L from 'leaflet';
import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import type { GeoPoint } from '@/features/activities/domain/entities/activity';

/**
 * Helper internal React Leaflet:
 * Memperbaiki bug klasik Leaflet di dalam Radix Dialog!
 * Saat dialog baru muncul, ukuran container peta masih bertransisi.
 * Memanggil `invalidateSize()` + `fitBounds()` setelah mount memastikan tile peta
 * dark-mode ter-render penuh tanpa kotak abu-abu dan rute otomatis pas di tengah layar.
 */
function MapViewportController({ coords }: { coords: GeoPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (coords.length < 2) return;

    const bounds = L.latLngBounds(coords);
    const applyFit = () => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [28, 28] });
    };

    applyFit();
    // Panggil ulang sekali lagi setelah animasi modal selesai (~120ms)
    const timer = window.setTimeout(applyFit, 120);
    return () => window.clearTimeout(timer);
  }, [map, coords]);

  return null;
}

/**
 * Widget Peta Rute Dark-Mode berbasis React Leaflet (100% gratis tanpa API key).
 * Memakai CircleMarker SVG untuk Start (Hijau) & Finish (Merah) sehingga
 * kebal terhadap bug default marker icon 404 saat di-bundle Vite.
 */
export function RouteMapView({
  coords,
  title,
}: {
  coords: GeoPoint[];
  title: string;
}) {
  if (coords.length < 2) return null;

  const startPt = coords[0];
  const endPt = coords[coords.length - 1];

  return (
    <MapContainer
      center={startPt}
      zoom={15}
      scrollWheelZoom
      className="dark-osm-map h-full w-full"
    >
      {/* Tile OpenStreetMap (100% gratis tanpa API key) + CSS dark-mode filter di index.css */}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {/* Efek outer glow polyline */}
      <Polyline
        positions={coords}
        pathOptions={{
          color: '#a3e635',
          weight: 8,
          opacity: 0.25,
          lineCap: 'round',
        }}
      />

      {/* Garis rute utama */}
      <Polyline
        positions={coords}
        pathOptions={{
          color: '#a3e635',
          weight: 3.5,
          opacity: 0.95,
          lineCap: 'round',
        }}
      />

      {/* Marker Start */}
      <CircleMarker
        center={startPt}
        radius={7}
        pathOptions={{
          fillColor: '#10b981',
          color: '#020617',
          weight: 2,
          fillOpacity: 1,
        }}
      >
        <Popup>
          <strong>Titik Start</strong>
          <br />
          {title}
        </Popup>
      </CircleMarker>

      {/* Marker Finish */}
      <CircleMarker
        center={endPt}
        radius={7}
        pathOptions={{
          fillColor: '#f43f5e',
          color: '#020617',
          weight: 2,
          fillOpacity: 1,
        }}
      >
        <Popup>
          <strong>Titik Finish</strong>
          <br />
          {title}
        </Popup>
      </CircleMarker>

      <MapViewportController coords={coords} />
    </MapContainer>
  );
}
