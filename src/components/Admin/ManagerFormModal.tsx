import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

interface ManagerFormModalProps {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManagerFormModal({ initialData, onClose, onSuccess }: ManagerFormModalProps) {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    role: 'GESTOR'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '', // Edit mode: empty password means don't change
        role: initialData.role || 'GESTOR'
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const payload: any = {};
      
      if (initialData?.id) {
        if (formData.name && formData.name !== initialData.name) {
          payload.name = formData.name;
        }
        if (formData.email && formData.email !== initialData.email) {
          payload.email = formData.email;
        }
        if (formData.role && formData.role !== initialData.role) {
          payload.role = formData.role;
        }
        if (formData.password) {
          payload.password = formData.password;
        }

        // Se não houve alteração alguma, apenas fecha com sucesso
        if (Object.keys(payload).length > 0) {
          await api.patch(`/users/${initialData.id}`, payload);
        }
      } else {
        // Create mode
        if (!formData.password) {
          setErrorMsg('A senha é obrigatória para criar um novo gestor.');
          setIsSubmitting(false);
          return;
        }
        await api.post('/users', formData);
      }
      onSuccess();
    } catch (e: any) {
      console.error("Erro ao salvar gestor", e);
      setErrorMsg(e.response?.data?.message || "Erro ao salvar gestor. Verifique os campos e o e-mail.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-6 pointer-events-auto animate-in fade-in duration-200">
      <div className="bg-background p-6 rounded-2xl w-full max-w-md shadow-2xl border border-foreground/10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{initialData ? 'Editar Gestor' : 'Novo Gestor'}</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail</label>
            <Input 
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Senha {initialData && <span className="text-foreground/50 text-xs font-normal">(deixe em branco para não alterar)</span>}
            </label>
            <Input 
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder={initialData ? '••••••••' : 'Senha forte'}
              required={!initialData}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nível de Acesso</label>
            <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
              <SelectTrigger className="w-full h-11 rounded-xl bg-black/5 dark:bg-white/5 border-foreground/10">
                <SelectValue placeholder="Selecione o acesso" />
              </SelectTrigger>
              <SelectContent className="z-[150] rounded-xl">
                <SelectItem value="GESTOR">Gestor</SelectItem>
                <SelectItem value="ROOT">Administrador (ROOT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {errorMsg && (
            <p className="text-destructive text-sm font-medium">{errorMsg}</p>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Gestor'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
