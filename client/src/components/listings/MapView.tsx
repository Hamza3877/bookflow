import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { useMoney } from '../../hooks/useMoney';
import { Listing } from '../../types';

// Zooms the map so every marker is visible.
function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) return;
    const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [listings, map]);
  return null;
}

export default function MapView({ listings, search }: { listings: Listing[]; search?: string }) {
  const { money } = useMoney();
  const center: [number, number] = listings[0] ? [listings[0].lat, listings[0].lng] : [30.3753, 69.3451]; // Pakistan

  return (
    <MapContainer center={center} zoom={listings[0] ? 11 : 5} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds listings={listings} />
      {listings.map((l) => (
        <CircleMarker key={l.id} center={[l.lat, l.lng]} radius={10} pathOptions={{ color: '#17535C', fillColor: '#E8A33D', fillOpacity: 0.95, weight: 2 }}>
          <Popup>
            <div className="w-44">
              <img src={l.images[0]} alt="" className="mb-2 h-24 w-full rounded-md object-cover" />
              <p className="text-sm font-semibold leading-tight">{l.title}</p>
              <p className="mb-1 text-xs text-slate-500">{money(l.pricePerDay)} / night</p>
              <Link to={`/listings/${l.id}${search ? `?${search}` : ''}`} className="text-xs font-semibold text-brand-700 underline">
                View details
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
