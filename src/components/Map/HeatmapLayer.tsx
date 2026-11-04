import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { useThemeStore } from '@/store/useThemeStore';

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
  options?: L.HeatMapOptions;
}

export function HeatmapLayer({ points, options }: HeatmapLayerProps) {
  const map = useMap();
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    if (!map) return;

    // O raio base no zoom 16
    const baseZoom = 16;
    const baseRadius = 42;
    const baseBlur = 30;
    const isLight = theme === 'light';

    const computeRadiusAndBlur = (zoom: number) => {
      let scale = Math.pow(2, zoom - baseZoom);
      if (scale > 2.5) scale = 2.5;
      if (scale < 0.15) scale = 0.15;
      return {
        radius: Math.max(1, Math.round(baseRadius * scale)),
        blur: Math.max(1, Math.round(baseBlur * scale)),
      };
    };

    const initial = computeRadiusAndBlur(map.getZoom());

    const heatLayer = (L as any).heatLayer(points, {
      radius: initial.radius,
      blur: initial.blur,
      maxZoom: 18, // Controla a intensidade baseada no zoom
      max: isLight ? 3 : 3.5,
      minOpacity: isLight ? 0.55 : 0.38,
      gradient: isLight
        ? { 0.1: '#f59e0b', 0.5: '#ea580c', 0.85: '#dc2626', 1.0: '#991b1b' }
        : { 0.15: '#facc15', 0.55: '#f97316', 0.85: '#ef4444', 1.0: '#dc2626' },
      ...options
    });

    const patchSimpleHeatRadius = (heat: any) => {
      if (!heat || heat.__patchedDynamicOffset) return;
      heat.__patchedDynamicOffset = true;
      // Corrige o offset fixo de 200px do simpleheat para evitar quadrantes cortados em raios maiores
      heat.radius = function (r: number, blur?: number) {
        const b = blur || 15;
        const circle = (this._circle = document.createElement('canvas'));
        const ctx = circle.getContext('2d')!;
        const r2 = (this._r = r + b);
        const offset = Math.max(200, Math.ceil(r2 * 2 + 32));

        circle.width = circle.height = r2 * 2;
        ctx.shadowOffsetX = ctx.shadowOffsetY = offset;
        ctx.shadowBlur = b;
        ctx.shadowColor = 'black';

        ctx.beginPath();
        ctx.arc(r2 - offset, r2 - offset, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        return this;
      };
    };

    const origInitCanvas = heatLayer._initCanvas;
    heatLayer._initCanvas = function () {
      origInitCanvas.call(this);
      if (this._canvas) {
        this._canvas.style.transformOrigin = '0 0';
        this._canvas.style.transition = 'opacity 0.3s ease-out';
      }
      patchSimpleHeatRadius(this._heat);
      this._updateOptions();
    };

    // Usa a mesma transformação de zoom animada do Leaflet 1.9 (compatível com transform-origin: 0 0)
    heatLayer._animateZoom = function (e: any) {
      if (!this._map || !this._canvas || !this._drawnCenter || this._drawnZoom === undefined) return;
      const scale = this._map.getZoomScale(e.zoom, this._drawnZoom);
      const viewHalf = this._drawnSize.multiplyBy(0.5);
      const currentCenterPoint = this._map.project(this._drawnCenter, e.zoom);
      const topLeftOffset = viewHalf
        .multiplyBy(-scale)
        .add(currentCenterPoint)
        .subtract((this._map as any)._getNewPixelOrigin(e.center, e.zoom));
      L.DomUtil.setTransform(this._canvas, topLeftOffset, scale);
    };

    heatLayer._reset = function () {
      if (!this._map || !this._canvas || !this._heat) return;
      const topLeft = this._map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(this._canvas, topLeft);
      const size = this._map.getSize();
      if (this._heat._width !== size.x) {
        this._canvas.width = this._heat._width = size.x;
      }
      if (this._heat._height !== size.y) {
        this._canvas.height = this._heat._height = size.y;
      }
      this._drawnCenter = this._map.getCenter();
      this._drawnZoom = this._map.getZoom();
      this._drawnSize = size.clone();
      this._redraw();
    };

    // Evita índices negativos na grade quando pontos ficam próximos às bordas durante pan/flyTo
    heatLayer._redraw = function () {
      if (!this._map || !this._heat) return;
      const data: [number, number, number][] = [];
      const r = this._heat._r;
      const size = this._map.getSize();
      const bounds = new L.Bounds(L.point([-r, -r]), size.add([r, r]));
      const max = this.options.max === undefined ? 1 : this.options.max;
      const maxZoom = this.options.maxZoom === undefined ? this._map.getMaxZoom() : this.options.maxZoom;
      const v = 1 / Math.pow(2, Math.max(0, Math.min(maxZoom - this._map.getZoom(), 12)));
      const cellSize = r / 2;
      const grid: any[][] = [];
      const panePos = (this._map as any)._getMapPanePos();
      const offsetX = ((panePos.x % cellSize) + cellSize) % cellSize;
      const offsetY = ((panePos.y % cellSize) + cellSize) % cellSize;

      for (let i = 0, len = this._latlngs.length; i < len; i++) {
        const p = this._map.latLngToContainerPoint(this._latlngs[i]);
        if (bounds.contains(p)) {
          const x = Math.floor((p.x - offsetX) / cellSize) + 4;
          const y = Math.floor((p.y - offsetY) / cellSize) + 4;
          const alt =
            this._latlngs[i].alt !== undefined
              ? this._latlngs[i].alt
              : this._latlngs[i][2] !== undefined
              ? +this._latlngs[i][2]
              : 1;
          const k = alt * v;

          grid[y] = grid[y] || [];
          const cell = grid[y][x];

          if (!cell) {
            grid[y][x] = [p.x, p.y, k];
          } else {
            cell[0] = (cell[0] * cell[2] + p.x * k) / (cell[2] + k);
            cell[1] = (cell[1] * cell[2] + p.y * k) / (cell[2] + k);
            cell[2] += k;
          }
        }
      }

      for (let i = 0, len = grid.length; i < len; i++) {
        if (grid[i]) {
          for (let j = 0, len2 = grid[i].length; j < len2; j++) {
            const cell = grid[i][j];
            if (cell) {
              data.push([Math.round(cell[0]), Math.round(cell[1]), Math.min(cell[2], max)]);
            }
          }
        }
      }

      this._heat.data(data).draw(this.options.minOpacity);
      this._frame = null;
    };

    heatLayer.addTo(map);

    let lastRadius = initial.radius;
    let lastBlur = initial.blur;
    let lastZoom = map.getZoom();

    const updateCanvasFade = (zoom: number) => {
      if (!heatLayer._canvas) return;
      if (zoom < 17.0) {
        heatLayer._canvas.style.opacity = '1';
        heatLayer._canvas.style.visibility = 'visible';
      } else if (zoom >= 18.0) {
        heatLayer._canvas.style.opacity = '0';
        heatLayer._canvas.style.visibility = 'hidden';
      } else {
        const fade = (18.0 - zoom) / 1.0;
        heatLayer._canvas.style.opacity = String(Math.max(0, Math.min(1, fade)));
        heatLayer._canvas.style.visibility = 'visible';
      }
    };

    const syncHeatmap = (forceRedraw = false) => {
      if ((map as any)._animatingZoom && !forceRedraw) return;

      const currentZoom = map.getZoom();
      const currentCenter = map.getCenter();
      updateCanvasFade(currentZoom);

      if (
        !forceRedraw &&
        heatLayer._drawnCenter &&
        heatLayer._drawnZoom === currentZoom &&
        heatLayer._drawnCenter.equals(currentCenter)
      ) {
        return;
      }

      const { radius, blur } = computeRadiusAndBlur(currentZoom);
      if (radius !== lastRadius || blur !== lastBlur) {
        lastRadius = radius;
        lastBlur = blur;
        heatLayer.options.radius = radius;
        heatLayer.options.blur = blur;
        if (heatLayer._heat) {
          heatLayer._heat.radius(radius, blur);
        }
      }

      lastZoom = currentZoom;
      heatLayer._reset();
    };

    const handleContinuousMoveOrZoom = (e: any) => {
      if ((map as any)._animatingZoom) return;
      const currentZoom = map.getZoom();
      if (e?.flyTo || e?.pinch || Math.abs(currentZoom - lastZoom) > 1e-5) {
        syncHeatmap(false);
      }
    };

    const handleZoomAnim = (e: any) => {
      if (typeof e?.zoom === 'number') {
        updateCanvasFade(e.zoom);
      }
    };

    const handleMoveOrZoomEnd = () => {
      syncHeatmap(true);
    };

    syncHeatmap(true);

    // Sincroniza em tempo real durante flyTo (foco no pin), pinch-zoom e ao encerrar animações
    map.on('move', handleContinuousMoveOrZoom);
    map.on('zoom', handleContinuousMoveOrZoom);
    map.on('zoomanim', handleZoomAnim);
    map.on('zoomend', handleMoveOrZoomEnd);
    map.on('moveend', handleMoveOrZoomEnd);

    return () => {
      map.off('move', handleContinuousMoveOrZoom);
      map.off('zoom', handleContinuousMoveOrZoom);
      map.off('zoomanim', handleZoomAnim);
      map.off('zoomend', handleMoveOrZoomEnd);
      map.off('moveend', handleMoveOrZoomEnd);
      map.removeLayer(heatLayer);
    };
  }, [map, points, options, theme]);

  return null;
}
