import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Upload, Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { VALID_CATEGORIES } from '@/shared/constants/categories';
import { convertToWebP } from '@/shared/utils/image';

interface ComplaintFormModalProps {
  onClose: () => void;
  onRequestMapSelection: () => void;
  selectedLocation: [number, number] | null;
  selectedAddress: string;
  onSuccess: () => void;
  hidden?: boolean;
  initialData?: any;
}

export function ComplaintFormModal({ 
  onClose, 
  onRequestMapSelection, 
  selectedLocation, 
  selectedAddress,
  onSuccess,
  hidden,
  initialData
}: ComplaintFormModalProps) {
  
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [address, setAddress] = useState(initialData?.address || selectedAddress);
  
  const [photoBase64, setPhotoBase64] = useState<string | null>(
    initialData?.photos && initialData.photos.length > 0 ? initialData.photos[0] : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync address when map selection updates it
  useState(() => {
    if (selectedAddress && selectedAddress !== 'Clique no mapa para marcar o local') {
      setAddress(selectedAddress);
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const webpBase64 = await convertToWebP(e.target.files[0], 1000, 0.75);
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
      } else {
        payload.photos = [];
      }

      if (initialData?.id) {
        await api.patch(`/complaints/${initialData.id}`, payload);
      } else {
        await api.post('/complaints', payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || `Erro ao ${initialData?.id ? 'atualizar' : 'registrar'} denúncia.`);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 pointer-events-auto animate-in fade-in duration-200 ${hidden ? 'hidden' : ''}`}>
      <div className="bg-background w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative border border-foreground/10 p-6">
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {initialData ? 'Editar Denúncia' : 'Nova Denúncia'}
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-full text-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar pr-1">
          <form id="complaintForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Categoria */}
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria *</label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="w-full h-11 px-3 rounded-xl bg-black/5 dark:bg-white/5 border-foreground/10 text-foreground text-sm">
                  <SelectValue placeholder="Selecione o problema..." />
                </SelectTrigger>
                <SelectContent className="z-[150] max-h-80 rounded-xl custom-scrollbar">
                  {VALID_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Localização via Mapa ou Texto */}
            <div>
              <label className="text-sm font-medium mb-1 block">Endereço *</label>
              <div className="flex gap-2">
                <Input 
                  value={address || (selectedAddress !== 'Clique no mapa para marcar o local' ? selectedAddress : '')}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores, 123"
                  className="bg-black/5 dark:bg-white/5 border-foreground/10 text-foreground h-11 rounded-xl flex-1 text-sm"
                  required
                />
                <Button 
                  type="button" 
                  onClick={onRequestMapSelection}
                  className="h-11 px-3 rounded-xl flex items-center gap-2 border border-foreground/10 bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <MapPin size={18} />
                  <span className="hidden sm:inline text-xs font-semibold">Mapa</span>
                </Button>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm font-medium mb-1 block">Descrição Detalhada *</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o problema com o máximo de detalhes possível..."
                className="w-full bg-black/5 dark:bg-white/5 border border-foreground/10 text-foreground rounded-xl p-3 min-h-[90px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {/* Foto (Opcional) */}
            <div>
              <label className="text-sm font-medium mb-1 block">Foto (Opcional)</label>
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
                  className="w-full h-28 rounded-xl border-2 border-dashed border-foreground/20 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-all gap-1.5 text-foreground/50 hover:text-primary"
                >
                  <div className="flex gap-3">
                    <Camera size={20} />
                    <ImageIcon size={20} />
                  </div>
                  <span className="text-xs font-medium">Tirar foto ou anexar imagem</span>
                </div>
              ) : (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-foreground/20 group">
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

        <div className="pt-4 mt-2 border-t border-foreground/10 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl">
            Cancelar
          </Button>
          <Button type="submit" form="complaintForm" className="rounded-xl px-6 min-w-[140px]" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {initialData ? 'Salvar Alterações' : 'Enviar Denúncia'}
              </>
            )}
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
}
