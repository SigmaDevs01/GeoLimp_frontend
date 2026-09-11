import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMapEvents, Marker } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HeatmapLayer } from '@/components/Map/HeatmapLayer';
import { BottomDetailCard } from '@/components/Map/BottomDetailCard';
import { SidebarLayout } from '@/components/Sidebar/SidebarLayout';
import { ComplaintFormModal } from '@/components/Map/ComplaintFormModal';
import { LocationPickerOverlay } from '@/components/Map/LocationPickerOverlay';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
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
  const { token, user, init } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  
  const [heatmapData, setHeatmapData] = useState<[number, number, number][]>([]);
  const [userComplaints, setUserComplaints] = useState<any[]>([]);
  
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  
  // Auth Warning
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  
  // Add Complaint Flow State
  const [showFormModal, setShowFormModal] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  
  // View Complaint State
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  useEffect(() => {
    init(); 
  }, [init]);

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

  const fetchMyComplaints = async () => {
    if (user?.role === 'cidadao') {
      try {
        const res = await api.get('/complaints/mine');
        setUserComplaints(res.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, [user]);

  const handleAddClick = () => {
    if (!token) {
      setShowAuthWarning(true);
    } else if (user?.role === 'cidadao') {
      setShowFormModal(true);
      setAddMode(false);
      setSelectedLocation(null);
      setSelectedAddress('');
    }
  };

  const handleRequestMapSelection = () => {
    setShowFormModal(false);
    setAddMode(true);
  };

  const handleLocationConfirmed = (address: string) => {
    setSelectedAddress(address);
    setAddMode(false);
    setShowFormModal(true);
  };

  const handleLocationCanceled = () => {
    setAddMode(false);
    setSelectedLocation(null);
    setShowFormModal(true); // volta pro form, se quiser
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setSelectedLocation(null);
    setSelectedAddress('');
    fetchMyComplaints(); // reload the user's complaints
    // optionally, refetch heatmap
  };

  const mapTileUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background font-sans">
      
      {token && user && (
        <SidebarLayout 
          onComplaintSelect={(comp) => setSelectedComplaint(comp)} 
          onAddComplaint={handleAddClick}
          userComplaints={userComplaints}
        />
      )}

      {/* Top Header Filters */}
      <div className={`absolute top-0 right-0 z-40 p-4 pointer-events-none flex justify-end items-start transition-all ${token ? 'left-96' : 'left-0 justify-between'}`}>
        {!token && (
          <div className="glass-panel glass-blur p-3 rounded-full pointer-events-auto flex items-center gap-3 ml-4 mt-2">
            <Logo className="h-6 w-auto text-foreground" />
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-4 mt-2 mr-4">
          <div className="flex items-center gap-2">
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

          {!token && (
            <button 
              onClick={() => navigate('/login')}
              className="glass-panel glass-blur h-10 px-6 rounded-full text-sm font-medium hover:bg-black/20 dark:hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <User size={16} /> Entrar
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Button - Only for Unlogged users now */}
      {!token && !addMode && (
        <div className="absolute bottom-10 right-10 z-40 flex flex-col items-end gap-4 pointer-events-none">
          <button 
            onClick={handleAddClick}
            className="h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 pointer-events-auto glass-panel hover:scale-105 active:scale-95 bg-primary/90 text-primary-foreground hover:bg-primary"
          >
            <Plus size={32} />
          </button>
        </div>
      )}

      {/* Map Interactive Overlay */}
      {addMode && (
        <LocationPickerOverlay 
          location={selectedLocation}
          onConfirm={handleLocationConfirmed}
          onCancel={handleLocationCanceled}
        />
      )}

      {/* Map */}
      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={13} 
        zoomControl={false}
        className="w-full h-full z-0 cursor-default absolute inset-0"
        style={{ cursor: addMode ? 'crosshair' : 'grab' }}
      >
        <TileLayer
          key={mapTileUrl}
          url={mapTileUrl}
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ZoomControl position="bottomright" />
        
        <HeatmapLayer points={heatmapData} />
        
        <MapClickHandler 
          addMode={addMode} 
          onLocationSelected={(lat, lng) => setSelectedLocation([lat, lng])} 
        />

        {addMode && selectedLocation && (
          <Marker position={selectedLocation} />
        )}

        {!addMode && userComplaints.map(comp => (
          comp.latitude && comp.longitude && (
            <Marker 
              key={comp.id} 
              position={[comp.latitude, comp.longitude]}
              eventHandlers={{
                click: () => setSelectedComplaint(comp)
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
          onClose={() => setShowFormModal(false)}
          onRequestMapSelection={handleRequestMapSelection}
          selectedLocation={selectedLocation}
          selectedAddress={selectedAddress}
          onSuccess={handleFormSuccess}
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
