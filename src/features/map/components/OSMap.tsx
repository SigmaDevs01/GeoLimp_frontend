import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock markers for now
const mockMarkers = [
  { id: 1, lat: -23.55052, lng: -46.633308, status: 'EM_ANDAMENTO', category: 'Lixo Acumulado' },
  { id: 2, lat: -23.55152, lng: -46.634308, status: 'PENDENTE', category: 'Buraco' },
];

export function OSMap() {
  const { theme } = useThemeStore();

  useEffect(() => {
    // We could apply a dark mode filter to the map tiles here if desired
    const mapTiles = document.querySelector('.leaflet-tile-pane');
    if (mapTiles) {
      if (theme === 'dark') {
        (mapTiles as HTMLElement).style.filter = 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7)';
      } else {
        (mapTiles as HTMLElement).style.filter = 'none';
      }
    }
  }, [theme]);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={[-23.55052, -46.633308]} // São Paulo default
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {mockMarkers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]}>
            <Popup>
              <strong>{marker.category}</strong><br/>
              Status: {marker.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
