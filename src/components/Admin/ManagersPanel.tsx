import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { ManagerFormModal } from './ManagerFormModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ManagersPanel() {
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [managerToEdit, setManagerToEdit] = useState<any>(null);

  // Modal de confirmação de exclusão
  const [managerToDelete, setManagerToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      const filtered = res.data.filter((u: any) => u.role === 'GESTOR' || u.role === 'ROOT');
      setManagers(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleOpenNew = () => {
    setManagerToEdit(null);
    setShowModal(true);
  };

  const handleOpenEdit = (manager: any) => {
    setManagerToEdit(manager);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!managerToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${managerToDelete.id}`);
      setManagerToDelete(null);
      fetchManagers();
    } catch (e) {
      console.error("Erro ao excluir", e);
      alert("Erro ao excluir gestor.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestores do Sistema</h2>
          <p className="text-foreground/60 text-sm mt-1">Administradores e usuários com privilégios</p>
        </div>
        <Button onClick={handleOpenNew} className="rounded-full shadow-lg"><Plus size={18} className="mr-2" /> Novo Gestor</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 pb-4 content-start">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : managers.length === 0 ? (
          <div className="text-center py-10 text-foreground/50">Nenhum gestor encontrado.</div>
        ) : (
          managers.map(manager => (
            <div key={manager.id} className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {manager.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    {manager.name || 'Sem nome'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-foreground/60">{manager.email}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${manager.role === 'ROOT' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                      {manager.role}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleOpenEdit(manager)}
                  className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Editar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setManagerToDelete(manager)}
                  className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <ManagerFormModal 
          initialData={managerToEdit}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchManagers();
          }}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!managerToDelete} onOpenChange={(open) => !open && setManagerToDelete(null)}>
        <AlertDialogContent className="z-[150] max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Gestor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o gestor <b>{managerToDelete?.name}</b>? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Sim, excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
