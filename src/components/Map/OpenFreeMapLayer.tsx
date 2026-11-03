import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Configura o worker URL no pipeline do Vite para evitar erro de carregamento do Web Worker
if (typeof window !== 'undefined') {
  try {
    setWorkerUrl(workerUrl);
  } catch (err) {
    console.warn('MapLibre workerUrl setup warning:', err);
  }
}

export const OPENFREEMAP_STYLES = {
  bright: 'https://tiles.openfreemap.org/styles/bright',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  positron: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

interface OpenFreeMapLayerProps {
  styleUrl?: string;
  theme?: string;
}

export function OpenFreeMapLayer({ styleUrl, theme }: OpenFreeMapLayerProps) {
  const map = useMap();
  const layerRef = useRef<any>(null);
  const currentStyleRef = useRef<string>('');

  // Define o estilo do OpenFreeMap diretamente: modo escuro ('dark') ou modo claro ('liberty')
  const activeStyle =
    styleUrl ||
    (theme === 'dark' ? OPENFREEMAP_STYLES.dark : OPENFREEMAP_STYLES.liberty);

  // Inicializa a camada MapLibre GL no Leaflet
  useEffect(() => {
    if (!map) return;

    if (!layerRef.current) {
      const glLayer = (L as any).maplibreGL({
        style: activeStyle,
        interactive: false,
        pane: 'tilePane',
      });

      glLayer.addTo(map);
      layerRef.current = glLayer;
      currentStyleRef.current = activeStyle;

      const glMap = glLayer.getMaplibreMap();
      if (glMap) {
        glMap.on('error', (e: any) => {
          console.warn('MapLibre GL error event:', e);
        });
      }
    }

    return () => {
      if (layerRef.current) {
        try {
          map.removeLayer(layerRef.current);
        } catch {
          // evita erro se o mapa já tiver sido desmontado
        }
        layerRef.current = null;
      }
    };
  }, [map]);

  // Altera a aparência do mapa diretamente via WebGL quando o tema alternar
  useEffect(() => {
    if (!layerRef.current) return;
    if (currentStyleRef.current === activeStyle) return;

    const glMap = layerRef.current.getMaplibreMap();
    if (glMap) {
      try {
        glMap.setStyle(activeStyle);
        currentStyleRef.current = activeStyle;
      } catch (err) {
        console.error('Erro ao alternar estilo do OpenFreeMap diretamente:', err);
      }
    }
  }, [activeStyle]);

  return null;
}
