import { MapContainer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { OpenFreeMapLayer } from '@/components/Map/OpenFreeMapLayer';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getIcon = (type: string) => {
  const isOS = type === 'OS';
  return L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="width: 16px; height: 16px; background-color: ${isOS ? '#3b82f6' : '#ef4444'}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

export function OSMap() {
  const { theme } = useThemeStore();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/map-items')
      .then(res => setItems(res.data))
      .catch(console.error);
  }, []);

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
        <OpenFreeMapLayer theme={theme} />

        {items.map((item) => (
          item.latitude && item.longitude && (
            <Marker key={item.id} position={[item.latitude, item.longitude]} icon={getIcon(item.type)}>
              <Popup>
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <div className="flex justify-between items-center border-b pb-2 mb-1">
                    <span className="font-bold text-xs">{item.protocol}</span>
                    <Badge variant={item.type === 'OS' ? 'default' : 'destructive'} className="text-[10px] h-5 px-1.5">
                      {item.type}
                    </Badge>
                  </div>
                  <div className="font-semibold text-sm">{item.category}</div>
                  <div className="text-xs text-muted-foreground">
                    Status: <strong className="text-foreground">{item.status}</strong>
                  </div>
                  {item.address && (
                    <div className="text-[10px] text-muted-foreground truncate" title={item.address}>
                      {item.address}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
