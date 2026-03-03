import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { collecteurApi } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import type { Collecteur } from '@/types';
import Button from '@/components/ui/Button';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon in react-leaflet (webpack/vite)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

function MapCenterController({ collecteurs }: { collecteurs: Collecteur[] }) {
  const map = useMap();
  useEffect(() => {
    if (collecteurs.length === 0) return;
    const valid = collecteurs.filter(
      (c) => c.lastLatitude != null && c.lastLongitude != null
    );
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].lastLatitude!, valid[0].lastLongitude!], 14);
    } else {
      const bounds = L.latLngBounds(
        valid.map((c) => [c.lastLatitude!, c.lastLongitude!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, collecteurs]);
  return null;
}

export default function CarteCollecteursPage() {
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = () => {
    collecteurApi
      .positions()
      .then((list) => setCollecteurs(Array.isArray(list) ? list : []))
      .catch(() => setCollecteurs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchPositions, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <PageLoader />;

  const withPosition = collecteurs.filter(
    (c) => c.lastLatitude != null && c.lastLongitude != null
  );

  const defaultCenter: [number, number] = [6.37, 2.42]; // Cotonou / Bénin par défaut
  const center =
    withPosition.length > 0
      ? ([withPosition[0].lastLatitude!, withPosition[0].lastLongitude!] as [number, number])
      : defaultCenter;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link to={AppRoutes.COLLECTEURS}>
          <Button variant="secondary">
            <HiOutlineArrowLeft className="h-4 w-4" /> Retour aux collecteurs
          </Button>
        </Link>
        <p className="text-sm text-gray-500">
          {withPosition.length} collecteur{withPosition.length !== 1 ? 's' : ''} avec position
        </p>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
        <div className="h-[calc(100vh-12rem)] min-h-[400px]">
          <MapContainer
            center={center}
            zoom={withPosition.length <= 1 ? 12 : 10}
            className="h-full w-full"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenterController collecteurs={withPosition} />
            {withPosition.map((c) => (
              <Marker
                key={c.id}
                position={[c.lastLatitude!, c.lastLongitude!]}
                icon={defaultIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">
                      {c.utilisateur?.prenom
                        ? `${c.utilisateur.nom} ${c.utilisateur.prenom}`
                        : c.utilisateur?.nom ?? c.codeCollecteur}
                    </p>
                    <p className="text-gray-500">{c.codeCollecteur}</p>
                    {c.lastPositionAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Dernière mise à jour :{' '}
                        {new Date(c.lastPositionAt).toLocaleString('fr-FR')}
                      </p>
                    )}
                    <Link
                      to={AppRoutes.COLLECTEUR_DETAIL.replace(':id', c.id)}
                      className="text-primary-600 hover:underline mt-1 inline-block"
                    >
                      Voir la fiche
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
