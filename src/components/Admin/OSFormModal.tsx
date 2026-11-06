import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useOSStore } from '@/store/useOSStore';
import { VALID_CATEGORIES } from '@/shared/constants/categories';

interface OSFormModalProps {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function OSFormModal({ initialData, onClose, onSuccess }: OSFormModalProps) {
  const { setPendingNewOS } = useOSStore();
  const [formData, setFormData] = useState({ 
    category: '', 
    description: '', 
    address: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category || '',
        description: initialData.description || '',
        address: initialData.address || ''
      });
    }
  }, [initialData]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        await api.patch(`/service-orders/${initialData.id}`, formData);
      } else {
        await api.post('/service-orders', formData);
      }
      onSuccess();
    } catch (e) {
      console.error("Erro ao salvar OS", e);
      alert("Erro ao salvar OS. Verifique os campos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestMapLocation = () => {
    setPendingNewOS(formData);
    onClose();
    window.dispatchEvent(new CustomEvent('open-map-tab'));
    window.dispatchEvent(new CustomEvent('request-os-location'));
  };

  const hasLegacyCategory = Boolean(
    formData.category && !VALID_CATEGORIES.includes(formData.category as any)
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-6 pointer-events-auto">
      <div className="bg-background p-6 rounded-2xl w-full max-w-md shadow-2xl border border-foreground/10 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{initialData?.id ? 'Editar OS' : 'Nova OS'}</h3>
          <button onClick={onClose} className="text-foreground/50 hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Categoria</label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="w-full h-11 px-3 rounded-xl bg-black/5 dark:bg-white/5 border-foreground/10 text-foreground text-sm">
                <SelectValue placeholder="Selecione uma categoria..." />
              </SelectTrigger>
              <SelectContent className="z-[150] max-h-80 rounded-xl custom-scrollbar">
                {hasLegacyCategory && (
                  <SelectItem value={formData.category}>{formData.category}</SelectItem>
                )}
                {VALID_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Endereço</label>
            <div className="flex gap-2">
              <Input className="flex-1" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Local da ocorrência" />
              {!initialData?.id && (
                <Button variant="outline" className="px-3 rounded-xl border-foreground/10" onClick={handleRequestMapLocation}>
                  <MapPin size={18} />
                </Button>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Descrição</label>
            <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detalhes do problema" />
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Salvando...' : 'Salvar OS'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
