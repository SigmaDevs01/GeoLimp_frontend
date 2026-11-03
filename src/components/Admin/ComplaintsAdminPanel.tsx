import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Search, Filter, MapPin, X, ChevronDown, Map, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSocketStore } from '@/store/useSocketStore';

export function ComplaintsAdminPanel({ onComplaintSelect }: { onComplaintSelect?: (comp: any) => void }) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [showImage, setShowImage] = useState(false);
  const { socket } = useSocketStore();

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Denúncias</h2>
          <p className="text-foreground/60 text-sm mt-1">Visão geral de todas as denúncias recebidas</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 w-4 h-4" />
          <Input placeholder="Buscar por protocolo ou endereço..." className="pl-9 bg-black/5 dark:bg-white/5 border-foreground/10 rounded-xl" />
        </div>
        <Button variant="outline" className="rounded-xl border-foreground/10"><Filter size={18} className="mr-2" /> Status</Button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-10 text-foreground/50">Nenhuma denúncia encontrada no sistema.</div>
        ) : (
          complaints.map(comp => (
            <div id={`complaint-card-${comp.id}`} key={comp.id} className="rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 hover:border-primary/50 transition-all flex flex-col overflow-hidden">
              <div onClick={() => toggleDetails(comp.id)} className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-foreground">{comp.protocol}</span>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">{comp.category}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
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
                          Foto
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
      </div>

      {showImage && selectedComplaint?.photos && selectedComplaint.photos.length > 0 && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 animate-in fade-in zoom-in-95 pointer-events-auto" onClick={() => setShowImage(false)}>
          <img src={selectedComplaint.photos[0]} alt="Denúncia" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
          <button className="absolute top-6 right-6 p-3 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors">
            <X size={24} />
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
