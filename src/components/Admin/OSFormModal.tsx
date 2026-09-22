import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useOSStore } from '@/store/useOSStore';

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 pointer-events-auto">
      <div className="bg-background p-6 rounded-2xl w-full max-w-md shadow-2xl border border-foreground/10 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{initialData ? 'Editar OS Avulsa' : 'Criar OS Avulsa'}</h3>
          <button onClick={onClose} className="text-foreground/50 hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Categoria</label>
            <select 
              className="w-full h-10 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border-foreground/10 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="">-- Selecione uma Categoria --</option>
              <option value="Varrição">Varrição</option>
              <option value="Coleta de Lixo">Coleta de Lixo</option>
              <option value="Limpeza de Bueiros">Limpeza de Bueiros</option>
              <option value="Poda de Árvore">Poda de Árvore</option>
              <option value="Roçagem">Roçagem</option>
              <option value="Iluminação Pública">Iluminação Pública</option>
              <option value="Buraco na via / rua">Buraco na via / rua</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Endereço</label>
            <div className="flex gap-2">
              <Input className="flex-1" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Local da ocorrência" />
              {!initialData && (
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
    </div>
  );
}
