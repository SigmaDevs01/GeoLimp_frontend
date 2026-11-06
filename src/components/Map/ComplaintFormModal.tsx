import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Upload, Camera, Loader2, Image as ImageIcon, Plus, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { VALID_CATEGORIES } from '@/shared/constants/categories';
import { convertToWebP } from '@/shared/utils/image';
import { maskPhone, normalizePhoneForApi, formatPhoneDisplay } from '@/shared/utils/phone.utils';
import { useAuthStore } from '@/store/useAuthStore';

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
  const { user, updateUser } = useAuthStore();
  
  const [category, setCategory] = useState(initialData?.category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [address, setAddress] = useState(initialData?.address || selectedAddress);
  
  const [photos, setPhotos] = useState<string[]>(
    Array.isArray(initialData?.photos) ? initialData.photos : []
  );
  const [loading, setLoading] = useState(false);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [error, setError] = useState('');

  // Pergunta sobre notificações no WhatsApp
  const [wantWhatsappNotifications, setWantWhatsappNotifications] = useState(
    user?.whatsappNotifications ?? true
  );
  const [userPhone, setUserPhone] = useState(
    user?.phone ? formatPhoneDisplay(user.phone) : ''
  );
  
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

      if (wantWhatsappNotifications) {
        payload.whatsappNotifications = true;
        if (userPhone && userPhone.trim()) {
          payload.phone = normalizePhoneForApi(userPhone.trim());
        }
      }

      if (selectedLocation) {
        payload.latitude = selectedLocation[0];
        payload.longitude = selectedLocation[1];
      }

      if (initialData?.id) {
        await api.patch(`/complaints/${initialData.id}`, payload);
      } else {
        await api.post('/complaints', payload);
      }

      if (wantWhatsappNotifications) {
        updateUser({
          whatsappNotifications: true,
          ...(userPhone?.trim() ? { phone: normalizePhoneForApi(userPhone.trim()) } : {}),
        });
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
                rows={3}
                className="w-full rounded-xl bg-black/5 dark:bg-white/5 border border-foreground/10 p-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary custom-scrollbar resize-none"
                required
              />
            </div>

            {/* Notificações no WhatsApp */}
            <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/25 space-y-2.5 transition-all">
              <div className="flex items-start gap-2.5">
                <input 
                  id="wantWhatsappCheck"
                  type="checkbox"
                  checked={wantWhatsappNotifications}
                  onChange={(e) => setWantWhatsappNotifications(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-foreground/30 text-green-600 focus:ring-green-500 accent-green-600 cursor-pointer shrink-0"
                />
                <label htmlFor="wantWhatsappCheck" className="text-xs text-foreground/90 cursor-pointer select-none leading-relaxed">
                  <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5 mb-0.5">
                    <MessageCircle size={14} />
                    Receber Notificações no WhatsApp
                  </span>
                  Desejo receber avisos em tempo real no meu WhatsApp quando o status desta e de outras denúncias for atualizado.
                </label>
              </div>

              {wantWhatsappNotifications && (
                <div className="pt-1 pl-6">
                  <label className="text-[11px] font-medium text-foreground/75 block mb-1">
                    Seu número do WhatsApp:
                  </label>
                  <Input 
                    type="tel"
                    placeholder="(99) 98503-9425"
                    value={userPhone}
                    onChange={(e) => setUserPhone(maskPhone(e.target.value))}
                    onBlur={() => {
                      if (userPhone) {
                        const norm = normalizePhoneForApi(userPhone);
                        if (norm) {
                          setUserPhone(maskPhone(norm.startsWith('55') ? norm.slice(2) : norm));
                        }
                      }
                    }}
                    className="bg-black/5 dark:bg-white/5 border-foreground/20 text-foreground h-9 rounded-lg text-xs max-w-xs"
                    required={wantWhatsappNotifications}
                  />
                </div>
              )}
            </div>

            {/* Upload de Fotos (Até 5 fotos) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Camera size={16} />
                  <span>Fotos do Local</span>
                </label>
                <span className="text-xs text-foreground/50">{photos.length}/5 fotos</span>
              </div>
              <p className="text-xs text-foreground/60 mb-2">
                Envie até 5 fotos para ajudar as equipes a identificarem o problema.
              </p>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                multiple 
                className="hidden" 
              />

              <div className="grid grid-cols-5 gap-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-foreground/10 group">
                    <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
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
