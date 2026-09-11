import { Button } from '@/components/ui/button';
import { MapPin, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LocationPickerOverlayProps {
  location: [number, number] | null;
  onConfirm: (address: string) => void;
  onCancel: () => void;
}

export function LocationPickerOverlay({ location, onConfirm, onCancel }: LocationPickerOverlayProps) {
  const [address, setAddress] = useState<string>('Buscando endereço...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location) {
      const fetchAddress = async () => {
        setLoading(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location[0]}&lon=${location[1]}&zoom=18&addressdetails=1`);
          const data = await res.json();
          setAddress(data.display_name || 'Endereço não encontrado');
        } catch (e) {
          setAddress(`${location[0].toFixed(5)}, ${location[1].toFixed(5)}`);
        } finally {
          setLoading(false);
        }
      };
      fetchAddress();
    } else {
      setAddress('Clique no mapa para marcar o local');
    }
  }, [location]);

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] w-full max-w-xl px-4 pointer-events-none">
      <div className="glass-panel p-4 rounded-full flex items-center justify-between shadow-2xl border-primary/20 pointer-events-auto animate-in slide-in-from-top-8 fade-in">
        
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
            <MapPin size={20} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Localização Selecionada</span>
            <span className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">
              {loading ? 'Buscando...' : address}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCancel}
            className="rounded-full text-foreground/50 hover:text-destructive hover:bg-destructive/10"
          >
            <X size={20} />
          </Button>
          <Button 
            onClick={() => onConfirm(address)}
            disabled={!location || loading}
            className="rounded-full px-6 flex items-center gap-2 shadow-lg"
          >
            <Check size={16} /> Confirmar
          </Button>
        </div>

      </div>
    </div>
  );
}
