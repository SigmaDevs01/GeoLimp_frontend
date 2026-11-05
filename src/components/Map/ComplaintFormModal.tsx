import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Upload, Camera, Loader2, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
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
  
  const [photos, setPhotos] = useState<string[]>(
    Array.isArray(initialData?.photos) ? initialData.photos : []
  );
  const [loading, setLoading] = useState(false);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync address when map selection updates it
  useState(() => {
    if (selectedAddress && selectedAddress !== 'Clique no mapa para marcar o local') {
      setAddress(selectedAddress);
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 5 - photos.length;
    if (availableSlots <= 0) {
      setError('O limite máximo é de 5 fotos por denúncia.');
      return;
    }

    setIsProcessingPhotos(true);
    setError('');

    try {
      const filesToProcess = Array.from(files).slice(0, availableSlots);
      const convertedPhotos: string[] = [];

      for (const file of filesToProcess) {
        const webpBase64 = await convertToWebP(file, 1000, 0.75);
        convertedPhotos.push(webpBase64);
      }

      setPhotos((prev) => [...prev, ...convertedPhotos]);
    } catch (err) {
      console.error('Erro ao converter imagens', err);
      setError('Erro ao processar as fotos enviadas.');
    } finally {
      setIsProcessingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
        photos: photos || [],
      };

      if (selectedLocation) {
        payload.latitude = selectedLocation[0];
        payload.longitude = selectedLocation[1];
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

            {/* Fotos (Opcional - Até 5 imagens) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">Fotos (Opcional)</label>
                <span className="text-xs text-foreground/50 font-medium">
                  {photos.length} de 5 adicionada{photos.length === 1 ? '' : 's'}
                </span>
              </div>

              <input 
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={photos.length >= 5 || isProcessingPhotos}
              />
              
              {/* Grid de Fotos e Botão de Adição */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-foreground/20 group">
                    <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-destructive"
                      title="Remover foto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                {photos.length < 5 && (
                  <div 
                    onClick={() => !isProcessingPhotos && fileInputRef.current?.click()}
                    className={`aspect-square rounded-xl border-2 border-dashed border-foreground/20 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-foreground/50 hover:text-primary ${
                      isProcessingPhotos ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isProcessingPhotos ? (
                      <Loader2 size={18} className="animate-spin text-primary" />
                    ) : (
                      <>
                        <Plus size={20} />
                        <span className="text-[10px] font-semibold text-center leading-tight">Adicionar</span>
                      </>
                    )}
                  </div>
                )}
              </div>
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
