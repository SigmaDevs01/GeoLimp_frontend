import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Search, Filter, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function ComplaintsAdminPanel() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

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

  const openDetails = async (id: string) => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setSelectedComplaint(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const generateOS = async (complaintId: string) => {
    if(confirm("Deseja gerar uma OS para esta denúncia?")) {
      try {
        await api.post('/service-orders', { complaintId });
        alert("OS gerada com sucesso!");
        fetchComplaints();
      } catch (e) {
        console.error("Erro ao gerar OS", e);
        alert("Erro ao gerar OS.");
      }
    }
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

      <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-10 text-foreground/50">Nenhuma denúncia encontrada no sistema.</div>
        ) : (
          complaints.map(comp => (
            <div key={comp.id} className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 hover:border-primary/50 transition-all flex items-center justify-between group">
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-foreground">{comp.protocol}</span>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">{comp.category}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    comp.status === 'RESOLVIDA' || comp.status === 'resolvido' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                    comp.status === 'EM_ANDAMENTO' || comp.status === 'em_andamento' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                    'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {comp.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-foreground/60 text-sm mt-1">
                  <MapPin size={14} />
                  <span className="line-clamp-1">{comp.address}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={() => openDetails(comp.id)} variant="secondary" size="sm" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Detalhes</Button>
                {comp.status === 'RECEBIDA' && !comp.serviceOrderProtocol && (
                  <Button onClick={() => generateOS(comp.id)} size="sm" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Gerar OS</Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Detalhes Denúncia */}
      {selectedComplaint && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl p-6">
          <div className="bg-background p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-foreground/10 overflow-y-auto max-h-full custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Detalhes da Denúncia</h3>
              <button onClick={() => setSelectedComplaint(null)} className="text-foreground/50 hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                  <span className="text-foreground/50 block text-xs mb-1">Protocolo</span>
                  <span className="font-bold">{selectedComplaint.protocol}</span>
                </div>
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                  <span className="text-foreground/50 block text-xs mb-1">Status</span>
                  <span className="font-bold">{selectedComplaint.status}</span>
                </div>
              </div>
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
              ) : (
                <div className="pt-4 flex justify-end">
                   <Button onClick={() => { generateOS(selectedComplaint.id); setSelectedComplaint(null); }}>Gerar Ordem de Serviço</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
