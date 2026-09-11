import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ServiceOrdersPanel() {
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOS, setSelectedOS] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newOSData, setNewOSData] = useState({ category: '', description: '', address: '' });
  
  // Modals state
  const [assigningOS, setAssigningOS] = useState<any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  const [completingOS, setCompletingOS] = useState<any>(null);

  const fetchOSs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/service-orders');
      setServiceOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/operations/teams');
      setTeams(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOSs();
    fetchTeams();
  }, []);

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
      await api.patch(`/service-orders/${completingOS.id}/status`, { status: 'CONCLUIDA' });
      setCompletingOS(null);
      fetchOSs();
    } catch (e) {
      console.error("Erro ao concluir OS", e);
    }
  };

  const openDetails = async (id: string) => {
    try {
      const res = await api.get(`/service-orders/${id}`);
      setSelectedOS(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-500 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ordens de Serviço</h2>
          <p className="text-foreground/60 text-sm mt-1">Gerencie a execução das equipes de campo</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="rounded-full shadow-lg"><Plus size={18} className="mr-2" /> Criar OS Avulsa</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 w-4 h-4" />
          <Input placeholder="Buscar por protocolo..." className="pl-9 bg-black/5 dark:bg-white/5 border-foreground/10 rounded-xl" />
        </div>
        <Button variant="outline" className="rounded-xl border-foreground/10"><Filter size={18} className="mr-2" /> Filtros</Button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : serviceOrders.length === 0 ? (
          <div className="text-center py-10 text-foreground/50">Nenhuma Ordem de Serviço encontrada.</div>
        ) : (
          serviceOrders.map(os => (
            <div key={os.id} className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 hover:border-primary/50 transition-all flex items-center justify-between group">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-primary">{os.protocol}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    os.status === 'RESOLVIDA' || os.status === 'CONCLUIDA' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                    os.status === 'EM_ANDAMENTO' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                    'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {os.status || 'PENDENTE'}
                  </span>
                </div>
                <h4 className="text-foreground font-medium">{os.category}</h4>
                <p className="text-foreground/60 text-sm mt-1 line-clamp-1">{os.address || 'Endereço não informado'}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={() => openDetails(os.id)} variant="secondary" size="sm" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Detalhes</Button>
                
                {(os.status === 'PENDENTE' || os.status === 'RECEBIDA') && (
                   <Button onClick={() => setAssigningOS(os)} size="sm" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Atribuir Equipe</Button>
                )}
                
                {os.status === 'EM_ANDAMENTO' && (
                   <Button onClick={() => setCompletingOS(os)} size="sm" className="rounded-lg bg-green-600 hover:bg-green-700 text-white opacity-0 group-hover:opacity-100 transition-opacity">Concluir Serviço</Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Criar OS Avulsa */}
      {isCreating && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl p-6">
          <div className="bg-background p-6 rounded-2xl w-full max-w-md shadow-2xl border border-foreground/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Criar OS Avulsa</h3>
              <button onClick={() => setIsCreating(false)} className="text-foreground/50 hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Categoria</label>
                <Input value={newOSData.category} onChange={e => setNewOSData({...newOSData, category: e.target.value})} placeholder="Ex: Poda de Árvore" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Endereço</label>
                <Input value={newOSData.address} onChange={e => setNewOSData({...newOSData, address: e.target.value})} placeholder="Local da ocorrência" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Descrição</label>
                <Textarea value={newOSData.description} onChange={e => setNewOSData({...newOSData, description: e.target.value})} placeholder="Detalhes do problema" />
              </div>
              <Button onClick={handleCreateOS} className="w-full">Salvar OS</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Atribuir Equipe */}
      {assigningOS && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl p-6">
          <div className="bg-background p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-foreground/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Atribuir Equipe</h3>
              <button onClick={() => setAssigningOS(null)} className="text-foreground/50 hover:text-foreground"><X size={20} /></button>
            </div>
            <p className="text-sm text-foreground/70 mb-4">Mover a OS <b>{assigningOS.protocol}</b> para "Em Andamento". Selecione a equipe responsável pelo serviço:</p>
            <div className="space-y-4">
              <select 
                className="w-full h-10 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border-foreground/10 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(e.target.value)}
              >
                <option value="">-- Selecione a Equipe --</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <Button onClick={handleAssignTeam} className="w-full">Iniciar OS</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Conclusão */}
      {completingOS && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl p-6">
          <div className="bg-background p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-foreground/10 text-center">
            <h3 className="text-xl font-bold mb-2">Concluir OS</h3>
            <p className="text-sm text-foreground/70 mb-6">Deseja realmente marcar a Ordem de Serviço <b>{completingOS.protocol}</b> como concluída?</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setCompletingOS(null)}>Cancelar</Button>
              <Button onClick={handleCompleteOS} className="bg-green-600 hover:bg-green-700 text-white">Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes OS */}
      {selectedOS && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl p-6">
          <div className="bg-background p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-foreground/10 overflow-y-auto max-h-full custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Detalhes da OS</h3>
              <button onClick={() => setSelectedOS(null)} className="text-foreground/50 hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                  <span className="text-foreground/50 block text-xs mb-1">Protocolo</span>
                  <span className="font-bold">{selectedOS.protocol}</span>
                </div>
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                  <span className="text-foreground/50 block text-xs mb-1">Status</span>
                  <span className="font-bold">{selectedOS.status}</span>
                </div>
              </div>
              
              {selectedOS.assignedTeam && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 block text-xs mb-1 font-semibold uppercase">Equipe Responsável</span>
                  <span className="font-bold">{selectedOS.assignedTeam.name}</span>
                </div>
              )}

              <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                <span className="text-foreground/50 block text-xs mb-1">Categoria</span>
                <span className="font-medium">{selectedOS.category}</span>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                <span className="text-foreground/50 block text-xs mb-1">Descrição</span>
                <p>{selectedOS.description}</p>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                <span className="text-foreground/50 block text-xs mb-1">Endereço</span>
                <p>{selectedOS.address}</p>
              </div>
              {selectedOS.complaint && (
                <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl">
                  <h4 className="font-semibold text-primary mb-2 text-xs uppercase tracking-wider">Denúncia Original</h4>
                  <p className="mb-1"><span className="text-foreground/60">Protocolo:</span> {selectedOS.complaint.protocol}</p>
                  <p><span className="text-foreground/60">Cidadão:</span> {selectedOS.complaint.user?.name || 'Não informado'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
