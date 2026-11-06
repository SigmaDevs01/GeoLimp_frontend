import { useCallback, useEffect, useState } from 'react';
import { MapContainer, useMapEvents, Marker } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OpenFreeMapLayer } from '@/components/Map/OpenFreeMapLayer';
import { HeatmapLayer } from '@/components/Map/HeatmapLayer';
import { BottomDetailCard } from '@/components/Map/BottomDetailCard';
import { SidebarLayout } from '@/components/Sidebar/SidebarLayout';
import { ComplaintFormModal } from '@/components/Map/ComplaintFormModal';
import { OSFormModal } from '@/components/Admin/OSFormModal';
import { LocationPickerOverlay } from '@/components/Map/LocationPickerOverlay';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, User, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useSocketStore } from '@/store/useSocketStore';
import { useOSStore } from '@/store/useOSStore';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/shared/components/Logo';
import { VALID_CATEGORIES } from '@/shared/constants/categories';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const WhatsAppIcon = ({ size = 28, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.159.57 4.186 1.564 5.938l-1.564 5.714 5.86-1.537c1.705.932 3.666 1.465 5.753 1.465 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
  </svg>
);

const DEFAULT_CENTER: [number, number] = [-5.5152, -47.4736];

const normalizeStatus = (value?: string) => {
  const upper = value?.trim().toUpperCase();
  if (upper === 'RESOLVIDA' || upper === 'RESOLVIDO' || upper === 'CONCLUIDA' || upper === 'CONCLUÍDA') {
    return 'RESOLVIDA';
  }
  if (upper === 'RECEBIDA' || upper === 'PENDENTE') {
    return 'RECEBIDA';
  }
  return upper || '';
};

const getIcon = (type?: string, isSelected?: boolean, isResolved?: boolean) => {
  const isOS = type === 'OS';
  let color = isOS ? '#3b82f6' : '#eab308';
  let ringColor = isOS ? 'rgba(59,130,246,0.35)' : 'rgba(234,179,8,0.35)';

  if (isResolved) {
    color = '#22c55e';
    ringColor = 'rgba(34,197,94,0.4)';
  }

  const size = isSelected ? 12 : 9;
  const ring = isSelected ? `0 0 0 4px ${ringColor}, ` : '';
  return L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="width: ${size}px; height: ${size}px; background-color: ${color}; border: 1.5px solid white; border-radius: 50%; box-shadow: ${ring}0 0 4px rgba(0,0,0,0.4); transition: all 0.2s ease;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

function MapEventsTracker({ 
  addMode, 
  onLocationSelected,
  onZoomChange
}: { 
  addMode: boolean; 
  onLocationSelected: (lat: number, lng: number) => void;
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      if (addMode) {
        onLocationSelected(e.latlng.lat, e.latlng.lng);
      }
    },
    zoomanim(e: any) {
      if (typeof e.zoom === 'number') {
        onZoomChange(e.zoom);
      }
    },
    zoom() {
      onZoomChange(map.getZoom());
    },
    zoomend() {
      onZoomChange(map.getZoom());
    }
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

export function MapPage() {
  const { user, init } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { socket, connect, disconnect } = useSocketStore();
  const { pendingNewOS, updatePendingNewOS } = useOSStore();
  const navigate = useNavigate();
  
  const [heatmapData, setHeatmapData] = useState<[number, number, number][]>([]);
  const [userComplaints, setUserComplaints] = useState<any[]>([]);
  
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [currentZoom, setCurrentZoom] = useState(16);
  
  const [typeFilter, setTypeFilter] = useState('denuncias');
  
  // Auth Warning
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  
  // Add Complaint Flow State
  const [showFormModal, setShowFormModal] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [osAddMode, setOsAddMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  
  // View Complaint State
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [complaintToEdit, setComplaintToEdit] = useState<any | null>(null);
  const [osToEdit, setOsToEdit] = useState<any | null>(null);
  const [showOsFormModal, setShowOsFormModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [suppressHeatmapOnFocus, setSuppressHeatmapOnFocus] = useState(false);
  const maxAllowedZoom = user ? 19 : 17;

  const handleZoomChange = useCallback((zoom: number) => {
    const normalized = Math.round(zoom * 1000) / 1000;
    setCurrentZoom(prev => (Math.floor(prev) === Math.floor(normalized) ? prev : normalized));
  }, []);

  useEffect(() => {
    if (!mapInstance) return;
    mapInstance.setMaxZoom(maxAllowedZoom);
    if (mapInstance.getZoom() > maxAllowedZoom) {
      mapInstance.setZoom(maxAllowedZoom);
    }
  }, [mapInstance, maxAllowedZoom]);

  const focusOnPoint = useCallback((comp: any) => {
    setSelectedComplaint(comp);
    if (mapInstance && comp?.latitude && comp?.longitude) {
      const currentMapZoom = mapInstance.getZoom();
      const targetZoom = Math.min(Math.max(Math.round(currentMapZoom) + 1, 18), maxAllowedZoom);

      // Se já estava em zoom >= 18, evita que o zoom-out intermediário do flyTo pisque o heatmap
      if (currentMapZoom >= 17.95 && targetZoom >= 18) {
        setSuppressHeatmapOnFocus(true);
        const clearSuppress = () => setSuppressHeatmapOnFocus(false);
        mapInstance.once('moveend', clearSuppress);
      }

      mapInstance.flyTo(
        [comp.latitude, comp.longitude],
        targetZoom,
        { animate: true, duration: 1.0 }
      );
    }
  }, [mapInstance, maxAllowedZoom]);

  useEffect(() => {
    init(); 
  }, [init]);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }
  }, [user, connect, disconnect]);

  useEffect(() => {
    if (!socket) return;

    const handleNewItem = (item: any) => {
      if (user?.role === 'cidadao') {
        if (item.type === 'OS') return;
        if (item.userId && item.userId !== user.id) return;
      }

      setUserComplaints(prev => {
        // Avoid duplicates
        if (prev.find(c => c.id === item.id)) return prev;
        return [...prev, item];
      });
    };

    const handleUpdateItem = (item: any) => {
      if (user?.role === 'cidadao' && item.type === 'OS') return;

      setUserComplaints(prev => 
        prev.map(c => c.id === item.id ? { ...c, ...item } : c)
      );
      setSelectedComplaint((prev: any) =>
        prev?.id === item.id ? { ...prev, ...item } : prev
      );
    };

    const handleDeleteItem = (item: { id: string, type: string }) => {
      setUserComplaints(prev => prev.filter(c => c.id !== item.id));
      setSelectedComplaint(prev => (prev?.id === item.id ? null : prev));
    };

    socket.on('new_map_item', handleNewItem);
    socket.on('update_map_item', handleUpdateItem);
    socket.on('delete_map_item', handleDeleteItem);

    return () => {
      socket.off('new_map_item', handleNewItem);
      socket.off('update_map_item', handleUpdateItem);
      socket.off('delete_map_item', handleDeleteItem);
    };
  }, [socket]);

  const fetchHeatmap = useCallback(async () => {
    try {
      const response = await api.get(`/complaints/heatmap`, { params: { category, status } });
      const points = response.data.map((item: any) => [
        item.latitude, item.longitude, item.intensity || 1
      ]) as [number, number, number][];
      setHeatmapData(points);
    } catch (error) {
      console.error("Erro ao buscar heatmap", error);
    }
  }, [category, status]);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  const fetchMapData = async () => {
    if (!user) return;
    try {
      if (user.role === 'cidadao') {
        const res = await api.get('/complaints/mine');
        setUserComplaints(res.data);
      } else {
        const res = await api.get('/admin/map-items');
        setUserComplaints(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [user]);

  useEffect(() => {
    const handleRequestOsLoc = () => {
      setOsAddMode(true);
      setSelectedLocation(null);
    };
    const handleOpenEdit = (e: any) => {
      setComplaintToEdit(e.detail.complaint);
      setAddMode(false);
      setSelectedLocation(null);
      setSelectedAddress(e.detail.complaint.address || '');
      setShowFormModal(true);
    };
    const handleOpenEditOs = (e: any) => {
      setOsToEdit(e.detail.os);
      setShowOsFormModal(true);
    };
    const handleSidebarChange = (e: any) => {
      setIsSidebarOpen(!!e.detail?.isOpen);
    };
    
    window.addEventListener('request-os-location', handleRequestOsLoc);
    window.addEventListener('open-edit-complaint', handleOpenEdit);
    window.addEventListener('open-edit-os', handleOpenEditOs);
    window.addEventListener('sidebar-state-change', handleSidebarChange);
    
    return () => {
      window.removeEventListener('request-os-location', handleRequestOsLoc);
      window.removeEventListener('open-edit-complaint', handleOpenEdit);
      window.removeEventListener('open-edit-os', handleOpenEditOs);
      window.removeEventListener('sidebar-state-change', handleSidebarChange);
    };
  }, []);

  // Fechar dropdowns de filtros ao clicar fora (incluindo no mapa)
  useEffect(() => {
    const handleGlobalPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isPopperOrTrigger = target.closest(
        '[data-radix-popper-content-wrapper], [data-radix-select-viewport], [role="listbox"], button[role="combobox"]'
      );
      if (!isPopperOrTrigger) {
        const openPopper = document.querySelector('[data-radix-popper-content-wrapper]');
        if (openPopper) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        }
      }
    };
    window.addEventListener('pointerdown', handleGlobalPointerDown, true);
    return () => window.removeEventListener('pointerdown', handleGlobalPointerDown, true);
  }, []);

  const handleAddClick = () => {
    if (!user) {
      setShowAuthWarning(true);
    } else if (user?.role === 'cidadao') {
      window.dispatchEvent(new CustomEvent('open-map-tab'));
      setSelectedComplaint(null);
      setComplaintToEdit(null);
      setShowFormModal(true);
      setAddMode(false);
      setSelectedLocation(null);
      setSelectedAddress('');
    }
  };

  const handleRequestMapSelection = () => {
    setAddMode(true);
  };

  const handleLocationConfirmed = (address: string) => {
    if (osAddMode) {
      updatePendingNewOS({
        address,
        latitude: selectedLocation?.[0],
        longitude: selectedLocation?.[1],
      });

      setOsAddMode(false);
      setSelectedLocation(null);
      window.dispatchEvent(new CustomEvent('open-os-tab'));
      return;
    }
    setSelectedAddress(address);
    setAddMode(false);
    setShowFormModal(true);
  };

  const handleLocationCanceled = () => {
    if (osAddMode) {
      setOsAddMode(false);
      setSelectedLocation(null);
      window.dispatchEvent(new CustomEvent('open-os-tab'));
      return;
    }
    setAddMode(false);
    setSelectedLocation(null);
    setShowFormModal(true); // volta pro form, se quiser
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setSelectedLocation(null);
    setSelectedAddress('');
    setComplaintToEdit(null);
    fetchMapData(); // reload the user's complaints
    fetchHeatmap();
  };

  const filteredMapItems = userComplaints.filter(item => {
    if (category !== 'all' && item.category?.trim().toLowerCase() !== category.trim().toLowerCase()) return false;
    if (status !== 'all' && normalizeStatus(item.status) !== normalizeStatus(status)) return false;
    
    if (user?.role !== 'cidadao') {
      if (typeFilter === 'denuncias' && item.type !== 'DENUNCIA') return false;
      if (typeFilter === 'os' && item.type !== 'OS') return false;
    }
    return true;
  });



  return (
    <div className="relative w-full h-screen overflow-hidden bg-background font-sans">
      
      {user && (
        <SidebarLayout 
          onComplaintSelect={(comp) => focusOnPoint(comp)} 
          onAddComplaint={handleAddClick}
          userComplaints={userComplaints}
        />
      )}

      {/* Top Header Filters */}
      <div className={`absolute top-0 right-0 z-40 p-2 sm:p-4 pointer-events-none flex justify-end items-start transition-all ${user ? 'left-0 md:left-24' : 'left-0 justify-between'}`}>
        {!user && (
          <div className="glass-panel glass-blur p-2 px-3 sm:px-4 rounded-full pointer-events-auto flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 mt-2">
            <Logo showName className="h-8 sm:h-10 w-auto text-foreground" />
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2 mr-2 sm:mr-4 max-w-full overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {user && user.role !== 'cidadao' && (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border border-border/70 shadow-lg h-9 sm:h-10 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-medium w-[125px] sm:w-[150px] focus:ring-0">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border-border/70">
                  <SelectItem value="denuncias">Denúncias</SelectItem>
                  <SelectItem value="os">Ordens de Serviço</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border border-border/70 shadow-lg h-9 sm:h-10 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-medium w-[135px] sm:w-[195px] focus:ring-0">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl max-h-80 custom-scrollbar bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border-border/70">
                <SelectItem value="all">Todas</SelectItem>
                {VALID_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border border-border/70 shadow-lg h-9 sm:h-10 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-medium w-[120px] sm:w-[155px] focus:ring-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border-border/70">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="RECEBIDA">Recebida</SelectItem>
                <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                <SelectItem value="RESOLVIDA">Resolvida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!user && (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button 
                onClick={toggleTheme}
                className="glass-panel glass-blur h-9 w-9 sm:h-10 sm:w-10 rounded-full text-foreground/70 hover:text-foreground hover:bg-black/20 dark:hover:bg-white/20 transition-colors flex items-center justify-center pointer-events-auto shadow-sm"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="glass-panel glass-blur h-9 px-4 sm:h-10 sm:px-6 rounded-full text-xs sm:text-sm font-medium hover:bg-black/20 dark:hover:bg-white/20 transition-colors flex items-center gap-1.5 sm:gap-2 pointer-events-auto"
              >
                <User size={15} /> Entrar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button - For unlogged users and logged-in citizens */}
      {(!user || user.role === 'cidadao') && !addMode && !osAddMode && !selectedComplaint && !isSidebarOpen && (
        <div className={`absolute z-40 flex items-center gap-2 sm:gap-3 pointer-events-none transition-all ${
          user 
            ? 'bottom-20 right-4 sm:bottom-10 sm:right-10' 
            : 'bottom-6 right-4 sm:bottom-10 sm:right-10'
        }`}>
          {!user && (
            <div className="flex items-center gap-2 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Balão esverdeado com aviso de denúncia pelo WhatsApp sem login */}
              <div className="relative bg-[#e8f8f0] dark:bg-[#0d2a1d] border border-[#25D366]/35 shadow-2xl py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-2xl flex items-center text-[11px] sm:text-xs font-bold text-[#075E54] dark:text-[#25D366]">
                <span className="whitespace-nowrap">Denuncie no WhatsApp!</span>
                <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#e8f8f0] dark:bg-[#0d2a1d] border-t border-r border-[#25D366]/35 rotate-45" />
              </div>

              {/* Botão de WhatsApp */}
              <a 
                href="https://wa.me/559981718936?text=Ol%C3%A1%2C%20quero%20fazer%20uma%20den%C3%BAncia"
                target="_blank"
                rel="noopener noreferrer"
                title="Fazer denúncia pelo WhatsApp sem login"
                className="h-13 w-13 sm:h-16 sm:w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 bg-[#25D366] text-white hover:bg-[#20ba59] cursor-pointer"
              >
                <WhatsAppIcon size={26} className="sm:hidden" />
                <WhatsAppIcon size={32} className="hidden sm:block" />
              </a>
            </div>
          )}

          <button 
            onClick={handleAddClick}
            title="Nova Denúncia"
            className="h-13 w-13 sm:h-16 sm:w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 pointer-events-auto hover:scale-105 active:scale-95 bg-primary/90 text-primary-foreground hover:bg-primary"
          >
            <Plus size={26} className="sm:hidden" />
            <Plus size={32} className="hidden sm:block" />
          </button>
        </div>
      )}

      {/* Map Interactive Overlay */}
      {(addMode || osAddMode) && (
        <LocationPickerOverlay 
          location={selectedLocation}
          onConfirm={handleLocationConfirmed}
          onCancel={handleLocationCanceled}
        />
      )}

      {/* Map */}
      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={16} 
        maxZoom={maxAllowedZoom}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full z-0 cursor-default absolute inset-0"
        style={{ cursor: addMode ? 'crosshair' : 'grab' }}
        ref={setMapInstance}
      >
        <OpenFreeMapLayer theme={theme} />
        
        {typeFilter !== 'os' && !suppressHeatmapOnFocus && (
          <HeatmapLayer 
            points={heatmapData} 
            isResolved={status === 'RESOLVIDA'}
          />
        )}
        
        <MapEventsTracker 
          addMode={addMode || osAddMode} 
          onLocationSelected={(lat, lng) => setSelectedLocation([lat, lng])} 
          onZoomChange={handleZoomChange}
        />

        {(addMode || osAddMode) && selectedLocation && (
          <Marker position={selectedLocation} />
        )}

        {!(addMode || osAddMode) && currentZoom >= 16 && filteredMapItems.map(comp => {
          const isFilterResolved = status === 'RESOLVIDA';
          return (
            comp.latitude && comp.longitude && (
              <Marker 
                key={comp.id} 
                position={[comp.latitude, comp.longitude]}
                icon={getIcon(comp.type, selectedComplaint?.id === comp.id, isFilterResolved)}
                eventHandlers={{
                  click: () => {
                    focusOnPoint(comp);
                  }
                }}
              />
            )
          );
        })}
      </MapContainer>

      {/* Modals & Overlays */}
      <BottomDetailCard 
        complaint={selectedComplaint} 
        onClose={() => setSelectedComplaint(null)} 
      />

      {showFormModal && (
        <ComplaintFormModal 
          hidden={addMode}
          initialData={complaintToEdit}
          onClose={() => {
            setShowFormModal(false);
            setAddMode(false);
            setComplaintToEdit(null);
          }}
          onRequestMapSelection={handleRequestMapSelection}
          selectedLocation={selectedLocation}
          selectedAddress={selectedAddress}
          onSuccess={handleFormSuccess}
        />
      )}

      {showOsFormModal && (
        <OSFormModal
          initialData={osToEdit}
          onClose={() => {
            setShowOsFormModal(false);
            setOsToEdit(null);
          }}
          onSuccess={() => {
            setShowOsFormModal(false);
            setOsToEdit(null);
            fetchMapData();
          }}
        />
      )}

      {showAuthWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 transition-opacity">
          <div className="glass-panel max-w-sm w-full p-6 rounded-3xl flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Login Necessário</h3>
            <p className="text-foreground/70 text-sm mb-5">
              Para registrar denúncias diretamente pela plataforma web, você precisa entrar com sua conta de cidadão.
            </p>

            <div className="flex w-full gap-3 mb-4">
              <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowAuthWarning(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 rounded-xl" onClick={() => navigate('/login')}>
                Fazer Login
              </Button>
            </div>

            {/* Divisor OU */}
            <div className="relative flex items-center justify-center w-full my-1">
              <div className="border-t border-foreground/15 w-full" />
              <span className="bg-background/80 px-3 text-xs font-bold text-foreground/50 tracking-wider">
                OU
              </span>
              <div className="border-t border-foreground/15 w-full" />
            </div>

            {/* Botão WhatsApp */}
            <a
              href="https://wa.me/559981718936?text=Ol%C3%A1%2C%20quero%20fazer%20uma%20den%C3%BAncia"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-3 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <WhatsAppIcon size={20} />
              Denunciar pelo WhatsApp
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
