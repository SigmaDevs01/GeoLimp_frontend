import { useState, useRef } from 'react';
import { X, MapPin, Upload, Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

const ValidCategories = [
  'Buraco na via / rua',
  'Entulho',
  'Lixo acumulado',
  'Iluminação pública',
  'Problemas em calçadas',
  'Sinalização danificada',
  'Semáforo com defeito',
  'Pavimentação',
  'Drenagem / alagamento',
  'Árvore ou vegetação interferindo na via (Poda/Manejo)',
  'Outros problemas de infraestrutura.'
];

interface ComplaintFormModalProps {
  onClose: () => void;
  onRequestMapSelection: () => void;
  selectedLocation: [number, number] | null;
  selectedAddress: string;
  onSuccess: () => void;
}

export function ComplaintFormModal({ 
  onClose, 
  onRequestMapSelection, 
  selectedLocation, 
  selectedAddress,
  onSuccess 
}: ComplaintFormModalProps) {
  
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(selectedAddress);
  
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync address when map selection updates it
  useState(() => {
    if (selectedAddress && selectedAddress !== 'Clique no mapa para marcar o local') {
      setAddress(selectedAddress);
    }
  });

  const convertToWebP = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to WebP, quality 0.8
          const dataUrl = canvas.toDataURL('image/webp', 0.8);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const webpBase64 = await convertToWebP(e.target.files[0]);
        setPhotoBase64(webpBase64);
      } catch (err) {
        console.error("Erro ao converter imagem", err);
        setError("Erro ao processar imagem.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload: any = {
        category,
        description,
        address: address || selectedAddress,
      };

      if (selectedLocation) {
        payload.latitude = selectedLocation[0];
        payload.longitude = selectedLocation[1];
      }

      if (photoBase64) {
        payload.photos = [photoBase64];
      }

      await api.post('/complaints', payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar denúncia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-background w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200 relative border border-border">
        
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
          <h2 className="text-2xl font-bold text-foreground">Nova Denúncia</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-foreground/50 hover:text-foreground transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="complaintForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Categoria */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/90">Categoria *</label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="bg-black/5 dark:bg-white/5 border-foreground/20 text-foreground h-12 rounded-xl">
                  <SelectValue placeholder="Selecione o problema..." />
                </SelectTrigger>
                <SelectContent>
                  {ValidCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Localização via Mapa ou Texto */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/90">Endereço *</label>
              <div className="flex gap-2">
                <Input 
                  value={address || (selectedAddress !== 'Clique no mapa para marcar o local' ? selectedAddress : '')}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores, 123"
                  className="bg-black/5 dark:bg-white/5 border-foreground/20 text-foreground h-12 rounded-xl flex-1"
                  required
                />
                <Button 
                  type="button" 
                  onClick={onRequestMapSelection}
                  className="h-12 px-4 rounded-xl flex items-center gap-2 bg-primary/20 text-primary hover:bg-primary/30"
                >
                  <MapPin size={20} />
                  <span className="hidden sm:inline">Mapa</span>
                </Button>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/90">Descrição Detalhada *</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o problema com o máximo de detalhes possível..."
                className="w-full bg-black/5 dark:bg-white/5 border border-foreground/20 text-foreground rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {/* Foto (Opcional) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/90">Foto (Opcional)</label>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              {!photoBase64 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-foreground/20 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-all gap-2 text-foreground/50 hover:text-primary"
                >
                  <div className="flex gap-4">
                    <Camera size={24} />
                    <ImageIcon size={24} />
                  </div>
                  <span className="text-sm font-medium">Tirar foto ou anexar imagem</span>
                </div>
              ) : (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-foreground/20 group">
                  <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setPhotoBase64(null)}
                    >
                      Remover Imagem
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-destructive text-sm font-medium">{error}</p>}
          </form>
        </div>

        <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 h-12">
            Cancelar
          </Button>
          <Button type="submit" form="complaintForm" className="rounded-xl px-8 h-12 text-base font-semibold shadow-xl" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
            Enviar Denúncia
          </Button>
        </div>

      </div>
    </div>
  );
}
