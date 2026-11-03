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

const getIcon = (type?: string, isSelected?: boolean) => {
  const isOS = type === 'OS';
  const color = isOS ? '#3b82f6' : '#f97316';
  const size = isSelected ? 12 : 9;
  const ring = isSelected ? `0 0 0 4px ${isOS ? 'rgba(59,130,246,0.35)' : 'rgba(249,115,22,0.35)'}, ` : '';
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
    
    window.addEventListener('request-os-location', handleRequestOsLoc);
    window.addEventListener('open-edit-complaint', handleOpenEdit);
    window.addEventListener('open-edit-os', handleOpenEditOs);
    
    return () => {
      window.removeEventListener('request-os-location', handleRequestOsLoc);
      window.removeEventListener('open-edit-complaint', handleOpenEdit);
      window.removeEventListener('open-edit-os', handleOpenEditOs);
    };
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
      <div className={`absolute top-0 right-0 z-40 p-4 pointer-events-none flex justify-end items-start transition-all ${user ? 'left-24' : 'left-0 justify-between'}`}>
        {!user && (
          <div className="glass-panel glass-blur p-2 px-4 rounded-full pointer-events-auto flex items-center gap-3 ml-4 mt-2">
            <Logo showName className="h-10 w-auto text-foreground" />
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-4 mt-2 mr-4">
          <div className="flex items-center gap-2">
            {user && user.role !== 'cidadao' && (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border border-border/70 shadow-lg h-10 px-4 rounded-full text-sm font-medium w-[150px] focus:ring-0">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border-border/70">
                  <SelectItem value="denuncias">Denúncias</SelectItem>
                  <SelectItem value="os">Ordens de Serviço</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border border-border/70 shadow-lg h-10 px-4 rounded-full text-sm font-medium w-[195px] focus:ring-0">
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
              <SelectTrigger className="bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border border-border/70 shadow-lg h-10 px-4 rounded-full text-sm font-medium w-[155px] focus:ring-0">
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
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="glass-panel glass-blur h-10 w-10 rounded-full text-foreground/70 hover:text-foreground hover:bg-black/20 dark:hover:bg-white/20 transition-colors flex items-center justify-center pointer-events-auto shadow-sm"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="glass-panel glass-blur h-10 px-6 rounded-full text-sm font-medium hover:bg-black/20 dark:hover:bg-white/20 transition-colors flex items-center gap-2 pointer-events-auto"
              >
                <User size={16} /> Entrar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button - For unlogged users and logged-in citizens */}
      {(!user || user.role === 'cidadao') && !addMode && !osAddMode && !selectedComplaint && (
        <div className="absolute bottom-10 right-10 z-40 flex flex-col items-end gap-4 pointer-events-none">
          <button 
            onClick={handleAddClick}
            title="Nova Denúncia"
            className="h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 pointer-events-auto hover:scale-105 active:scale-95 bg-primary/90 text-primary-foreground hover:bg-primary"
          >
            <Plus size={32} />
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
        
        {typeFilter !== 'os' && currentZoom < 18 && !suppressHeatmapOnFocus && <HeatmapLayer points={heatmapData} />}
        
        <MapEventsTracker 
          addMode={addMode || osAddMode} 
          onLocationSelected={(lat, lng) => setSelectedLocation([lat, lng])} 
          onZoomChange={handleZoomChange}
        />

        {(addMode || osAddMode) && selectedLocation && (
          <Marker position={selectedLocation} />
        )}

        {!(addMode || osAddMode) && currentZoom >= 16 && filteredMapItems.map(comp => (
          comp.latitude && comp.longitude && (
            <Marker 
              key={comp.id} 
              position={[comp.latitude, comp.longitude]}
              icon={getIcon(comp.type, selectedComplaint?.id === comp.id)}
              eventHandlers={{
                click: () => {
                  focusOnPoint(comp);
                }
              }}
            />
          )
        ))}
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
            <p className="text-foreground/70 text-sm mb-6">
              Para adicionar uma denúncia e ajudar a melhorar a cidade, você precisa criar uma conta ou fazer login.
            </p>
            <div className="flex w-full gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowAuthWarning(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={() => navigate('/login')}>
                Fazer Login
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
