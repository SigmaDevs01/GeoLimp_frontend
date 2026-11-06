import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Search, Filter, MapPin, X, ChevronDown, Map, Image as ImageIcon, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSocketStore } from '@/store/useSocketStore';
import { ImageGalleryModal } from '@/shared/components/ImageGalleryModal';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'RECEBIDA', label: 'Recebidas' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'RESOLVIDA', label: 'Resolvidas' },
];

export function ComplaintsAdminPanel({ onComplaintSelect }: { onComplaintSelect?: (comp: any) => void }) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [showImage, setShowImage] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocketStore();

  const fetchComplaints = useCallback(async (targetPage = 1, append = false, currentStatus = statusFilter, currentSearch = search) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params: any = { page: targetPage, limit: 10 };
      if (currentStatus && currentStatus !== 'all') params.status = currentStatus;
      if (currentSearch && currentSearch.trim()) params.search = currentSearch.trim();

      const res = await api.get('/complaints', { params });
      const data = res.data?.data ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      const more = res.data?.hasMore ?? false;
      const totalCount = res.data?.total ?? (Array.isArray(res.data) ? res.data.length : data.length);

      if (append) {
        setComplaints(prev => {
          const ids = new Set(prev.map(c => c.id));
          const newUnique = data.filter((item: any) => !ids.has(item.id));
          return [...prev, ...newUnique];
        });
      } else {
        setComplaints(data);
      }
      setPage(targetPage);
      setHasMore(more);
      setTotal(totalCount);
    } catch (e) {
      console.error('Erro ao carregar denúncias:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter, search]);

  // Carga inicial e quando o filtro de status mudar
  useEffect(() => {
    fetchComplaints(1, false, statusFilter, search);
  }, [statusFilter]);

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComplaints(1, false, statusFilter, search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fechar dropdown de filtro ao clicar fora
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
    fetchComplaints(page + 1, true, statusFilter, search);
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewItem = (item: any) => {
      if (item.type === 'DENUNCIA') {
        setComplaints(prev => {
          if (prev.find(c => c.id === item.id)) return prev;
          return [item, ...prev];
        });
      }
    };

    const handleUpdateItem = (item: any) => {
      if (item.type === 'DENUNCIA') {
        setComplaints(prev => 
          prev.map(c => c.id === item.id ? { ...c, ...item } : c)
        );
        setSelectedComplaint(prev => (prev?.id === item.id ? { ...prev, ...item } : prev));
      }
    };

    const handleDeleteItem = (item: any) => {
      if (item.type === 'DENUNCIA') {
        setComplaints(prev => prev.filter(c => c.id !== item.id));
        setSelectedComplaint(prev => (prev?.id === item.id ? null : prev));
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
    const handleOpenComplaint = async (e: any) => {
      const protocol = e.detail.protocol;
      if (!protocol) return;

      let list = complaints;
      if (list.length === 0) {
        try {
          const res = await api.get('/complaints');
          list = res.data;
          setComplaints(list);
        } catch (err) {}
      }

      const found = list.find((c: any) => c.protocol === protocol);
      if (found) {
        setSelectedComplaint(found);
        setTimeout(() => {
          document.getElementById(`complaint-card-${found.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    };
    
    window.addEventListener('open-complaint', handleOpenComplaint);
    return () => window.removeEventListener('open-complaint', handleOpenComplaint);
  }, [complaints]);

  const toggleDetails = (id: string) => {
    if (selectedComplaint?.id === id) {
      setSelectedComplaint(null);
    } else {
      const found = complaints.find(c => c.id === id);
      if (found) {
        setSelectedComplaint(found);
      }
    }
  };

  // OS generation is handled automatically by the system
  const handleViewOS = (protocol: string) => {
    window.dispatchEvent(new CustomEvent('open-os-tab'));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-os', { detail: { protocol } }));
    }, 50);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-500 relative">
      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Gestão de Denúncias</h2>
          <p className="text-foreground/60 text-xs md:text-sm mt-0.5">Visão geral de todas as denúncias recebidas</p>
        </div>
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
        ) : complaints.length === 0 ? (
          <div className="text-center py-8 text-xs sm:text-sm text-foreground/50">Nenhuma denúncia encontrada no sistema.</div>
        ) : (
          complaints.map(comp => (
            <div id={`complaint-card-${comp.id}`} key={comp.id} className="rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 hover:border-primary/50 transition-all flex flex-col overflow-hidden">
              <div onClick={() => toggleDetails(comp.id)} className="p-3.5 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <div className="flex-1 mr-3 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-foreground text-xs sm:text-sm">{comp.protocol}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider">{comp.category}</span>
                    <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                      comp.status?.toUpperCase() === 'RESOLVIDA' || comp.status?.toUpperCase() === 'RESOLVIDO' || comp.status?.toUpperCase() === 'CONCLUIDA' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                      comp.status?.toUpperCase() === 'EM_ANDAMENTO' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                      'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {(comp.status?.toUpperCase() === 'RESOLVIDO' || comp.status?.toUpperCase() === 'CONCLUIDA'
                        ? 'RESOLVIDA'
                        : comp.status)?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/60 text-sm mt-1">
                    <MapPin size={14} />
                    <span className="line-clamp-1">{comp.address}</span>
                  </div>
                </div>
                
                <div className="flex items-center text-foreground/50">
                  <ChevronDown size={20} className={`transition-transform duration-300 ${selectedComplaint?.id === comp.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {selectedComplaint?.id === comp.id && (
                <div className="px-5 pb-5 pt-0 border-t border-foreground/10 mt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="space-y-4 text-sm mt-4">
                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                      <span className="text-foreground/50 block text-xs mb-1">Descrição</span>
                      <p>{selectedComplaint.description}</p>
                    </div>
                    
                    {selectedComplaint.user && (
                      <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                        <h4 className="font-semibold text-foreground mb-2 text-xs uppercase tracking-wider">Dados do Cidadão</h4>
                        <p className="mb-1"><span className="text-foreground/60">Nome:</span> {selectedComplaint.user.name}</p>
                        <p className="mb-1"><span className="text-foreground/60">Email:</span> {selectedComplaint.user.email}</p>
                        <p><span className="text-foreground/60">Telefone:</span> {selectedComplaint.user.phone || 'Não informado'}</p>
                      </div>
                    )}

                    {selectedComplaint.serviceOrderProtocol ? (
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl">
                        <h4 className="font-semibold text-primary mb-2 text-xs uppercase tracking-wider">OS Gerada</h4>
                        <p className="mb-1"><span className="text-foreground/60">Protocolo OS:</span> {selectedComplaint.serviceOrderProtocol}</p>
                        {selectedComplaint.serviceOrder && (
                          <p><span className="text-foreground/60">Status OS:</span> {selectedComplaint.serviceOrder.status}</p>
                        )}
                      </div>
                    ) : null}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-foreground/10">
                      {selectedComplaint.photos && selectedComplaint.photos.length > 0 && (
                        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setShowImage(true)}>
                          <ImageIcon size={16} className="mr-2" />
                          {selectedComplaint.photos.length > 1 ? `Fotos (${selectedComplaint.photos.length})` : 'Foto'}
                        </Button>
                      )}
                      
                      <Button variant="secondary" size="sm" className="rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20" onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-map-tab'));
                        onComplaintSelect?.(selectedComplaint);
                      }}>
                        <Map size={16} className="mr-2" />
                        Ver no mapa
                      </Button>

                      {selectedComplaint.serviceOrderProtocol && (
                        <Button onClick={() => handleViewOS(selectedComplaint.serviceOrderProtocol)} size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                          Ver OS
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
                  <span>Carregando mais denúncias...</span>
                </>
              ) : (
                <>
                  <span>Mostrar mais</span>
                  <span className="text-xs text-foreground/50 font-normal">({complaints.length} de {total})</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <ImageGalleryModal
        isOpen={showImage}
        photos={selectedComplaint?.photos || []}
        title={selectedComplaint?.category || 'Fotos da Denúncia'}
        onClose={() => setShowImage(false)}
      />
    </div>
  );
}
