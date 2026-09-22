import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
  options?: L.HeatMapOptions;
}

export function HeatmapLayer({ points, options }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const heatLayer = (L as any).heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 20,
      max: 3, // Needs 3 complaints overlapping to become completely red
      gradient: { 0.2: '#0055ff', 0.4: '#00ffff', 0.6: '#00ff00', 0.8: '#ffff00', 1.0: '#ff0000' },
      ...options
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, options]);

  return null;
}
