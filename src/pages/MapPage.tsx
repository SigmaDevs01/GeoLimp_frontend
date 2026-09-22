import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMapEvents, Marker, CircleMarker } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [-5.5152, -47.4736];

const getIcon = (type?: string) => {
  const isOS = type === 'OS';
  return L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="width: 14px; height: 14px; background-color: ${isOS ? '#3b82f6' : '#f97316'}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

function MapClickHandler({ 
  addMode, 
  onLocationSelected 
}: { 
  addMode: boolean; 
  onLocationSelected: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (addMode) {
        onLocationSelected(e.latlng.lat, e.latlng.lng);
      }
    },
  });
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

  useEffect(() => {
    if (mapInstance && selectedComplaint && selectedComplaint.latitude && selectedComplaint.longitude) {
      mapInstance.flyTo(
        [selectedComplaint.latitude, selectedComplaint.longitude], 
        18, 
        { animate: true, duration: 1.5 }
      );
    }
  }, [mapInstance, selectedComplaint]);

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
        prev.map(c => c.id === item.id ? item : c)
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

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const response = await api.get(`/complaints/heatmap`, { params: { category, status } });
        const points = response.data.map((item: any) => [
          item.latitude, item.longitude, item.intensity || 1
        ]) as [number, number, number][];
        setHeatmapData(points);
      } catch (error) {
        console.error("Erro ao buscar heatmap", error);
      }
    };
    fetchHeatmap();
  }, [category, status]);

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
    // optionally, refetch heatmap
  };

  const filteredMapItems = userComplaints.filter(item => {
    if (category !== 'all' && item.category?.toLowerCase() !== category.toLowerCase()) return false;
    if (status !== 'all' && item.status?.toLowerCase() !== status.toLowerCase()) return false;
    
    if (user?.role !== 'cidadao') {
      if (typeFilter === 'denuncias' && item.type !== 'DENUNCIA') return false;
      if (typeFilter === 'os' && item.type !== 'OS') return false;
    }
    return true;
  });

  const mapTileUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background font-sans">
      
      {user && (
        <SidebarLayout 
          onComplaintSelect={(comp) => setSelectedComplaint(comp)} 
          onAddComplaint={handleAddClick}
          userComplaints={userComplaints}
        />
      )}

      {/* Top Header Filters */}
      <div className={`absolute top-0 right-0 z-40 p-4 pointer-events-none flex justify-end items-start transition-all ${user ? 'left-96' : 'left-0 justify-between'}`}>
        {!user && (
          <div className="glass-panel glass-blur p-2 px-4 rounded-full pointer-events-auto flex items-center gap-3 ml-4 mt-2">
            <Logo showName className="h-10 w-auto text-foreground" />
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-4 mt-2 mr-4">
          <div className="flex items-center gap-2">
            {user && user.role !== 'cidadao' && (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="glass-panel glass-blur border-none h-10 px-4 rounded-full text-sm font-medium w-[150px] focus:ring-0">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="denuncias">Denúncias</SelectItem>
                  <SelectItem value="os">Ordens de Serviço</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="glass-panel glass-blur border-none h-10 px-4 rounded-full text-sm font-medium w-[160px] focus:ring-0">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="buraco">Buraco</SelectItem>
                <SelectItem value="entulho">Entulho</SelectItem>
                <SelectItem value="iluminacao">Iluminação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="glass-panel glass-blur border-none h-10 px-4 rounded-full text-sm font-medium w-[140px] focus:ring-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
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

      {/* Floating Action Button - Only for Unlogged users now */}
      {!user && !addMode && (
        <div className="absolute bottom-10 right-10 z-40 flex flex-col items-end gap-4 pointer-events-none">
          <button 
            onClick={handleAddClick}
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
        zoom={15} 
        maxZoom={20}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full z-0 cursor-default absolute inset-0"
        style={{ cursor: addMode ? 'crosshair' : 'grab' }}
        ref={setMapInstance}
      >
        <TileLayer
          key={mapTileUrl}
          url={mapTileUrl}
          maxZoom={20}
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {typeFilter !== 'os' && <HeatmapLayer points={heatmapData} />}
        
        <MapClickHandler 
          addMode={addMode || osAddMode} 
          onLocationSelected={(lat, lng) => setSelectedLocation([lat, lng])} 
        />

        {(addMode || osAddMode) && selectedLocation && (
          <Marker position={selectedLocation} />
        )}

        {!(addMode || osAddMode) && filteredMapItems.map(comp => (
          comp.latitude && comp.longitude && (
            <Marker 
              key={comp.id} 
              position={[comp.latitude, comp.longitude]}
              icon={getIcon(comp.type)}
              eventHandlers={{
                click: () => {
                  setSelectedComplaint(comp);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
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
