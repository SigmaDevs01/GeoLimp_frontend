import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Search, Filter, Plus, Users, User, X, ChevronDown, MapPin, Trash2, MoreVertical, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOSStore } from '@/store/useOSStore';
import { useSocketStore } from '@/store/useSocketStore';
import { OSFormModal } from './OSFormModal';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'RECEBIDA', label: 'Recebidas' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'RESOLVIDA', label: 'Resolvidas' },
];

export function ServiceOrdersPanel() {
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const [selectedOS, setSelectedOS] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newOSData, setNewOSData] = useState({ category: '', description: '', address: '' });
  const { pendingNewOS, setPendingNewOS } = useOSStore();
  const { socket } = useSocketStore();
  
  // Modals state
  const [assigningOS, setAssigningOS] = useState<any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [osToDelete, setOsToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [completingOS, setCompletingOS] = useState<any>(null);
  const [viewingTeam, setViewingTeam] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);

  const fetchOSs = useCallback(async (targetPage = 1, append = false, currentStatus = statusFilter, currentSearch = search) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params: any = { page: targetPage, limit: 10 };
      if (currentStatus && currentStatus !== 'all') params.status = currentStatus;
      if (currentSearch && currentSearch.trim()) params.search = currentSearch.trim();

      const res = await api.get('/service-orders', { params });
      const data = res.data?.data ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      const more = res.data?.hasMore ?? false;
      const totalCount = res.data?.total ?? (Array.isArray(res.data) ? res.data.length : data.length);

      if (append) {
        setServiceOrders(prev => {
          const ids = new Set(prev.map(o => o.id));
          const newUnique = data.filter((item: any) => !ids.has(item.id));
          return [...prev, ...newUnique];
        });
      } else {
        setServiceOrders(data);
      }
      setPage(targetPage);
      setHasMore(more);
      setTotal(totalCount);
    } catch (e) {
      console.error('Erro ao carregar Ordens de Serviço:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter, search]);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/operations/teams');
      setTeams(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOSs(1, false, statusFilter, search);
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOSs(1, false, statusFilter, search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClickOutside = (e: MouseEvent | PointerEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    window.addEventListener('pointerdown', handleClickOutside, true);
    return () => window.removeEventListener('pointerdown', handleClickOutside, true);
  }, [isFilterOpen]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchOSs(page + 1, true, statusFilter, search);
  };

  useEffect(() => {
    fetchTeams();

    if (pendingNewOS) {
      setNewOSData({
        category: pendingNewOS.category || '',
        description: pendingNewOS.description || '',
        address: pendingNewOS.address || ''
      });
      setIsCreating(true);
      setPendingNewOS(null);
    }
  }, [pendingNewOS]);

  useEffect(() => {
    if (!socket) return;

    const handleNewItem = (item: any) => {
      if (item.type === 'OS') {
        setServiceOrders(prev => {
          if (prev.find(o => o.id === item.id)) return prev;
          // Optimistically add it at the top. Missing deep relations might require a refetch for full details,
          // but at least it shows up in real time.
          return [item, ...prev];
        });
      }
    };

    const handleUpdateItem = (item: any) => {
      if (item.type === 'OS') {
        setServiceOrders(prev => 
          prev.map(o => o.id === item.id ? { ...o, ...item } : o)
        );
        // Se a OS selecionada for a que atualizou, atualiza ela tbm
        setSelectedOS(prev => (prev?.id === item.id ? { ...prev, ...item } : prev));
      }
    };

    const handleDeleteItem = (item: any) => {
      if (item.type === 'OS') {
        setServiceOrders(prev => prev.filter(o => o.id !== item.id));
        setSelectedOS(prev => (prev?.id === item.id ? null : prev));
      }
    };

    socket.on('new_map_item', handleNewItem);
    socket.on('update_map_item', handleUpdateItem);
    socket.on('delete_map_item', handleDeleteItem);

    return () => {
      socket.off('new_map_item', handleNewItem);
      socket.off('update_map_item', handleUpdateItem);
      socket.off('delete_map_item', handleDeleteItem);
    };
  }, [socket]);

  useEffect(() => {
    const handleOpenOS = async (e: any) => {
      const protocol = e.detail.protocol;
      if (!protocol) return;

      // Ensure we have the latest list to find the ID
      let list = serviceOrders;
      if (list.length === 0) {
        try {
          const res = await api.get('/service-orders');
          list = res.data;
          setServiceOrders(list);
        } catch (err) {}
      }

      const found = list.find((o: any) => o.protocol === protocol);
      if (found) {
        setSelectedOS(found);
        setTimeout(() => {
          document.getElementById(`os-card-${found.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    };

    window.addEventListener('open-os', handleOpenOS);
    
    return () => {
      window.removeEventListener('open-os', handleOpenOS);
    };
  }, [serviceOrders]);

  const handleCreateOS = async () => {
    try {
      await api.post('/service-orders', newOSData);
      setIsCreating(false);
      fetchOSs();
    } catch (e) {
      console.error("Erro ao criar OS", e);
      alert("Erro ao criar OS avulsa. Verifique os campos.");
    }
  };

  const handleAssignTeam = async () => {
    if (!selectedTeamId) return alert("Selecione uma equipe!");
    try {
      await api.patch(`/service-orders/${assigningOS.id}/status`, { status: 'EM_ANDAMENTO', teamId: selectedTeamId });
      setAssigningOS(null);
      setSelectedTeamId('');
      fetchOSs();
    } catch (e) {
      console.error("Erro ao atribuir equipe", e);
    }
  };

  const handleCompleteOS = async () => {
    try {
      await api.patch(`/service-orders/${completingOS.id}/status`, { status: 'RESOLVIDA' });
      setCompletingOS(null);
      fetchOSs();
    } catch (e) {
      console.error("Erro ao concluir OS", e);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/service-orders/${osToDelete.id}`);
      setOsToDelete(null);
      fetchOSs();
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir a OS');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleDetails = (id: string) => {
    if (selectedOS?.id === id) {
      setSelectedOS(null);
    } else {
      const found = serviceOrders.find(o => o.id === id);
      if (found) setSelectedOS(found);
    }
  };

  const handleViewComplaint = (protocol: string) => {
    window.dispatchEvent(new CustomEvent('open-complaints-tab'));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-complaint', { detail: { protocol } }));
    }, 50);
  };

  const handleOpenTeamMembers = async (team: any) => {
    if (!team) return;
    const cachedTeam = teams.find(t => t.id === team.id);
    const initialMembers = team.professionals ?? cachedTeam?.professionals ?? [];
    setViewingTeam({ ...cachedTeam, ...team });
    setTeamMembers(initialMembers);
    setLoadingTeamMembers(initialMembers.length === 0);
    try {
      const res = await api.get(`/operations/teams/${team.id}/professionals`);
      setTeamMembers(res.data);
    } catch (e) {
      console.error('Erro ao buscar membros da equipe', e);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  useEffect(() => {
    if (!viewingTeam) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingTeam(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingTeam]);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-500 relative">
      <div className="flex items-center justify-between mb-3 md:mb-6">
        <div className="hidden md:block">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Ordens de Serviço</h2>
          <p className="text-foreground/60 text-xs md:text-sm mt-0.5">Gerencie a execução das equipes de campo</p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="sm" className="rounded-full shadow-md text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4">
          <Plus size={15} className="mr-1.5" /> Nova OS
        </Button>
      </div>

      <div className="flex gap-2 sm:gap-4 mb-3 sm:mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-foreground/50 w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por protocolo, endereço..." 
            className="pl-8 sm:pl-9 pr-7 sm:pr-8 bg-black/5 dark:bg-white/5 border-foreground/10 rounded-xl h-8 sm:h-9 text-xs sm:text-sm" 
          />
          {search && (
            <button 
              type="button"
              onClick={() => setSearch('')} 
              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="relative shrink-0" ref={filterMenuRef}>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFilterOpen(prev => !prev)}
            className={`rounded-xl border-foreground/10 transition-colors h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3 ${statusFilter !== 'all' ? 'border-primary text-primary bg-primary/10' : ''}`}
          >
            <Filter size={14} className="mr-1.5" />
            {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || 'Todos'}
            <ChevronDown size={13} className={`ml-1 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </Button>

          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-40 sm:w-48 rounded-xl sm:rounded-2xl bg-[#e1e4ea] dark:bg-[#18181b] border border-border/80 shadow-2xl p-1 z-30 animate-in fade-in zoom-in-95 duration-150">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                    statusFilter === opt.value
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  <span>{opt.label}</span>
                  {statusFilter === opt.value && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 sm:pr-2 space-y-2.5 sm:space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary"></div></div>
        ) : serviceOrders.length === 0 ? (
          <div className="text-center py-8 text-xs sm:text-sm text-foreground/50">Nenhuma Ordem de Serviço encontrada.</div>
        ) : (
          serviceOrders.map(os => (
            <div id={`os-card-${os.id}`} key={os.id} className="rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 hover:border-primary/50 transition-all flex flex-col overflow-hidden">
              <div onClick={() => toggleDetails(os.id)} className="p-3.5 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <div className="min-w-0 pr-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                    <span className="font-bold text-primary text-xs sm:text-sm truncate">{os.protocol}</span>
                    <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                      os.status?.toUpperCase() === 'RESOLVIDA' || os.status?.toUpperCase() === 'RESOLVIDO' || os.status?.toUpperCase() === 'CONCLUIDA' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                      os.status?.toUpperCase() === 'EM_ANDAMENTO' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                      'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {(os.status?.toUpperCase() === 'CONCLUIDA' || os.status?.toUpperCase() === 'RESOLVIDO'
                        ? 'RESOLVIDA'
                        : (os.status || 'RECEBIDA')).replace('_', ' ')}
                    </span>
                    {!os.complaintId && !os.complaint ? (
                      <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                        OS Avulsa (Gestão)
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        Origem: Denúncia
                      </span>
                    )}
                  </div>
                  <h4 className="text-foreground font-medium text-xs sm:text-sm truncate">{os.category}</h4>
                  <p className="text-foreground/60 text-[11px] sm:text-xs mt-0.5 line-clamp-1">{os.address || 'Endereço não informado'}</p>
                </div>
                
                <div className="flex items-center text-foreground/50 shrink-0">
                  <ChevronDown size={16} className={`transition-transform duration-300 ${selectedOS?.id === os.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {selectedOS?.id === os.id && (
                <div className="px-5 pb-5 pt-0 border-t border-foreground/10 mt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="space-y-4 text-sm mt-4">
                    {selectedOS.assignedTeam && (
                      <button
                        type="button"
                        onClick={() => handleOpenTeamMembers(selectedOS.assignedTeam)}
                        className="w-full text-left bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <span className="text-blue-600 dark:text-blue-400 block text-xs mb-1 font-semibold uppercase">Equipe Responsável</span>
                          <span className="font-bold text-foreground">{selectedOS.assignedTeam.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 opacity-75 group-hover:opacity-100 transition-opacity">
                          <Users size={16} />
                          <span>Ver membros</span>
                        </div>
                      </button>
                    )}
                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                      <span className="text-foreground/50 block text-xs mb-1">Descrição</span>
                      <p>{selectedOS.description}</p>
                    </div>
                    {selectedOS.complaint ? (
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-semibold text-primary text-xs uppercase tracking-wider">Origem: Denúncia do Cidadão</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            Denúncia
                          </span>
                        </div>
                        <p className="mb-1"><span className="text-foreground/60">Protocolo:</span> {selectedOS.complaint.protocol}</p>
                        <p><span className="text-foreground/60">Cidadão:</span> {selectedOS.complaint.user?.name || 'Não informado'}</p>
                      </div>
                    ) : (
                      <div className="bg-purple-500/10 border border-purple-500/25 p-3 rounded-xl">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-semibold text-purple-600 dark:text-purple-400 text-xs uppercase tracking-wider">Origem: Gestor / Administração</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                            OS Avulsa
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80">Esta Ordem de Serviço foi gerada de forma <b>avulsa</b> pela equipe de gestão / administração pública.</p>
                        {selectedOS.createdBy && (
                          <p className="mt-2 text-xs">
                            <span className="text-foreground/60">Criado por:</span> <b className="text-foreground">{selectedOS.createdBy.name || selectedOS.createdBy.email}</b> ({selectedOS.createdBy.role})
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-foreground/10">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm rounded-lg bg-black/10 dark:bg-white/10 hover:bg-destructive hover:text-destructive-foreground text-foreground transition-colors" 
                        onClick={() => setOsToDelete(selectedOS)}
                      >
                        <Trash2 size={14} className="mr-1.5" /> Excluir
                      </Button>

                      {(selectedOS.status === 'PENDENTE' || selectedOS.status === 'RECEBIDA') && (
                        <Button 
                          onClick={() => setAssigningOS(selectedOS)} 
                          size="sm" 
                          className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm rounded-lg"
                        >
                          Atribuir Equipe
                        </Button>
                      )}
                      
                      {selectedOS.status === 'EM_ANDAMENTO' && (
                        <Button 
                          onClick={() => setCompletingOS(selectedOS)} 
                          size="sm" 
                          className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white"
                        >
                          Concluir Serviço
                        </Button>
                      )}

                      {selectedOS.complaint?.protocol && (
                        <Button
                          onClick={() => handleViewComplaint(selectedOS.complaint.protocol)}
                          size="sm"
                          className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Ver Denúncia
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {hasMore && !loading && (
          <div className="pt-2 pb-4 flex justify-center">
            <Button
              variant="outline"
              disabled={loadingMore}
              onClick={handleLoadMore}
              className="w-full py-5 rounded-2xl border-foreground/10 hover:border-primary/50 hover:bg-primary/5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  <span>Carregando mais ordens de serviço...</span>
                </>
              ) : (
                <>
                  <span>Mostrar mais</span>
                  <span className="text-xs text-foreground/50 font-normal">({serviceOrders.length} de {total})</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Modal Criar OS Avulsa */}
      {isCreating && (
        <OSFormModal
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            fetchOSs();
          }}
        />
      )}

      {/* Modal Atribuir Equipe */}
      {assigningOS && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          data-modal="true"
          onPointerDown={e => {
            if (e.target === e.currentTarget) e.stopPropagation();
          }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 pointer-events-auto animate-in fade-in duration-200"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setAssigningOS(null);
              setSelectedTeamId('');
            }
          }}
        >
          <div
            className="bg-background p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-foreground/10 animate-in zoom-in-95 duration-200"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-foreground">Atribuir Equipe</h3>
              <button
                type="button"
                onClick={() => {
                  setAssigningOS(null);
                  setSelectedTeamId('');
                }}
                className="p-1.5 rounded-full text-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-foreground/70 mb-4">
              Mover a OS <b>{assigningOS.protocol}</b> para &quot;Em Andamento&quot;. Selecione a equipe responsável pelo serviço:
            </p>
            <div className="space-y-4">
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-full h-11 px-3 rounded-xl bg-black/5 dark:bg-white/5 border-foreground/10 text-foreground text-sm">
                  <SelectValue placeholder="Selecione a equipe..." />
                </SelectTrigger>
                <SelectContent 
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  className="z-[150] max-h-72 rounded-xl custom-scrollbar"
                >
                  {teams.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-foreground/50">
                      Nenhuma equipe cadastrada
                    </div>
                  ) : (
                    teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleAssignTeam} className="w-full rounded-xl h-11">
                Iniciar OS
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Confirmar Conclusão */}
      {completingOS && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          data-modal="true"
          onPointerDown={e => {
            if (e.target === e.currentTarget) e.stopPropagation();
          }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 pointer-events-auto animate-in fade-in duration-200"
          onClick={e => {
            if (e.target === e.currentTarget) setCompletingOS(null);
          }}
        >
          <div
            className="bg-background p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-foreground/10 text-center animate-in zoom-in-95 duration-200"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2 text-foreground">Concluir OS</h3>
            <p className="text-sm text-foreground/70 mb-6">Deseja realmente marcar a Ordem de Serviço <b>{completingOS.protocol}</b> como concluída?</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setCompletingOS(null)}>Cancelar</Button>
              <Button onClick={handleCompleteOS} className="bg-green-600 hover:bg-green-700 text-white">Confirmar</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Membros da Equipe */}
      {viewingTeam && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          data-modal="true"
          onPointerDown={e => {
            if (e.target === e.currentTarget) e.stopPropagation();
          }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 pointer-events-auto animate-in fade-in duration-200"
          onClick={e => {
            if (e.target === e.currentTarget) setViewingTeam(null);
          }}
        >
          <div
            className="bg-background p-6 rounded-2xl w-full max-w-md shadow-2xl border border-foreground/10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  Membros da Equipe
                </span>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Users size={20} className="text-primary shrink-0" />
                  <span>{viewingTeam.name}</span>
                </h3>
                {viewingTeam.description && (
                  <p className="text-xs text-foreground/60 mt-1">{viewingTeam.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewingTeam(null)}
                className="p-1.5 rounded-full text-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {!loadingTeamMembers && (
              <div className="text-xs font-medium text-foreground/50 mb-3">
                {teamMembers.length} {teamMembers.length === 1 ? 'profissional vinculado' : 'profissionais vinculados'}
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {loadingTeamMembers ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8 text-foreground/50 text-sm bg-black/5 dark:bg-white/5 rounded-xl border border-foreground/5">
                  Nenhum profissional vinculado a esta equipe.
                </div>
              ) : (
                teamMembers.map((member: any) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-foreground/10 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <User size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-foreground truncate">{member.fullName}</p>
                      <p className="text-xs text-foreground/60">Matrícula: {member.identifier}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-foreground/10 flex justify-end">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setViewingTeam(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete OS Alert Dialog */}
      <AlertDialog open={!!osToDelete} onOpenChange={(open) => !open && setOsToDelete(null)}>
        <AlertDialogContent className="z-[110]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ordem de Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta Ordem de Serviço? Essa ação não pode ser desfeita.
              {osToDelete?.complaintId && ' A denúncia original associada também será excluída do sistema.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
