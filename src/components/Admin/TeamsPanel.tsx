import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Users, X, User, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function TeamsPanel() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  const [isCreatingMember, setIsCreatingMember] = useState(false);
  const [newMember, setNewMember] = useState({ fullName: '', identifier: '' });

  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [editingMember, setEditingMember] = useState<any | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/operations/teams');
      setTeams(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeam.name) return alert('Nome da equipe é obrigatório');
    try {
      await api.post('/operations/teams', newTeam);
      setIsCreatingTeam(false);
      setNewTeam({ name: '', description: '' });
      fetchTeams();
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewMembers = async (teamId: string) => {
    setSelectedTeamId(teamId);
    setLoadingMembers(true);
    try {
      const res = await api.get(`/operations/teams/${teamId}/professionals`);
      setMembers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateMember = async () => {
    if (!newMember.fullName || !newMember.identifier || !selectedTeamId) return alert('Preencha os dados do profissional');
    try {
      await api.post('/operations/professionals', { ...newMember, teamId: selectedTeamId });
      setIsCreatingMember(false);
      setNewMember({ fullName: '', identifier: '' });
      handleViewMembers(selectedTeamId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam?.name) return alert('Nome da equipe é obrigatório');
    try {
      await api.patch(`/operations/teams/${editingTeam.id}`, {
        name: editingTeam.name,
        description: editingTeam.description
      });
      setEditingTeam(null);
      fetchTeams();
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar equipe');
    }
  };

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a equipe "${name}"?\nIsso removerá também todos os profissionais vinculados a ela.`)) return;
    try {
      await api.delete(`/operations/teams/${id}`);
      fetchTeams();
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir equipe');
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember?.fullName || !editingMember?.identifier) return alert('Preencha os dados do profissional');
    try {
      await api.patch(`/operations/professionals/${editingMember.id}`, {
        fullName: editingMember.fullName,
        identifier: editingMember.identifier
      });
      setEditingMember(null);
      if (selectedTeamId) handleViewMembers(selectedTeamId);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar profissional');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Excluir o profissional "${name}"?`)) return;
    try {
      await api.delete(`/operations/professionals/${id}`);
      if (selectedTeamId) handleViewMembers(selectedTeamId);
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir profissional');
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-500 relative">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="hidden md:block">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Equipes de Campo</h2>
          <p className="text-foreground/60 text-xs md:text-sm mt-0.5">Gestão de equipes e profissionais terceirizados</p>
        </div>
        <Button onClick={() => setIsCreatingTeam(true)} size="sm" className="rounded-full shadow-md text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"><Plus size={15} className="mr-1.5" /> Nova Equipe</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 pb-4 content-start">
        {loading ? (
          <div className="col-span-full flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : teams.length === 0 ? (
          <div className="col-span-full text-center py-10 text-foreground/50">Nenhuma equipe cadastrada.</div>
        ) : (
          teams.map(team => (
            <div key={team.id} className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 hover:border-primary/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <Users size={18} className="text-primary" /> {team.name}
                  </h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingTeam(team)} className="text-foreground/50 hover:text-primary"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteTeam(team.id, team.name)} className="text-foreground/50 hover:text-destructive"><Trash2 size={16} /></button>
                  </div>
                </div>
                <p className="text-sm text-foreground/70 mb-4">{team.description || 'Sem descrição.'}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-foreground/10">
                <span className="text-xs font-semibold text-foreground/50">
                  Profissionais vinculados
                </span>
                <Button onClick={() => handleViewMembers(team.id)} variant="ghost" size="sm" className="h-8 rounded-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity">Ver Membros</Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nova Equipe */}
      {isCreatingTeam && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-6 pointer-events-auto animate-in fade-in duration-200">
          <div className="bg-background p-6 rounded-2xl w-full max-w-md shadow-2xl border border-foreground/10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Criar Nova Equipe</h3>
              <button onClick={() => setIsCreatingTeam(false)} className="text-foreground/50 hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome da Equipe</label>
                <Input value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} placeholder="Ex: Equipe Alfa (Centro)" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Descrição</label>
                <Textarea value={newTeam.description} onChange={e => setNewTeam({...newTeam, description: e.target.value})} placeholder="Área de atuação e detalhes..." />
              </div>
              <Button onClick={handleCreateTeam} className="w-full">Salvar Equipe</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Editar Equipe */}
      {editingTeam && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-6 pointer-events-auto animate-in fade-in duration-200">
          <div className="bg-background p-6 rounded-2xl w-full max-w-md shadow-2xl border border-foreground/10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Editar Equipe</h3>
              <button onClick={() => setEditingTeam(null)} className="text-foreground/50 hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome da Equipe</label>
                <Input value={editingTeam.name} onChange={e => setEditingTeam({...editingTeam, name: e.target.value})} placeholder="Ex: Equipe Alfa (Centro)" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Descrição</label>
                <Textarea value={editingTeam.description} onChange={e => setEditingTeam({...editingTeam, description: e.target.value})} placeholder="Área de atuação e detalhes..." />
              </div>
              <Button onClick={handleUpdateTeam} className="w-full">Atualizar Equipe</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Ver Membros */}
      {selectedTeamId && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-6 pointer-events-auto animate-in fade-in duration-200">
          <div className="bg-background p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-foreground/10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><Users size={20} className="text-primary" /> Membros da Equipe</h3>
              <button onClick={() => { setSelectedTeamId(null); setIsCreatingMember(false); setEditingMember(null); }} className="text-foreground/50 hover:text-foreground"><X size={20} /></button>
            </div>

            {(isCreatingMember || editingMember) ? (
              <div className="space-y-4 mb-4 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-foreground/10">
                <h4 className="font-bold text-sm">{editingMember ? 'Editar Profissional' : 'Adicionar Profissional'}</h4>
                <div>
                  <label className="text-xs font-medium mb-1 block">Nome Completo</label>
                  <Input 
                    value={editingMember ? editingMember.fullName : newMember.fullName} 
                    onChange={e => editingMember ? setEditingMember({...editingMember, fullName: e.target.value}) : setNewMember({...newMember, fullName: e.target.value})} 
                    placeholder="Ex: João da Silva" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Matrícula (Identificador)</label>
                  <Input 
                    value={editingMember ? editingMember.identifier : newMember.identifier} 
                    onChange={e => editingMember ? setEditingMember({...editingMember, identifier: e.target.value}) : setNewMember({...newMember, identifier: e.target.value})} 
                    placeholder="Ex: MAT-12345" 
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => { setIsCreatingMember(false); setEditingMember(null); }} variant="outline" className="flex-1">Cancelar</Button>
                  <Button onClick={editingMember ? handleUpdateMember : handleCreateMember} className="flex-1">{editingMember ? 'Atualizar' : 'Salvar'}</Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setIsCreatingMember(true)} className="w-full mb-4" variant="outline"><Plus size={16} className="mr-2" /> Adicionar Profissional</Button>
            )}

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 space-y-2">
              {loadingMembers ? (
                <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
              ) : members.length === 0 ? (
                <div className="text-center py-6 text-foreground/50 text-sm">Nenhum profissional vinculado a esta equipe.</div>
              ) : (
                members.map(member => (
                  <div key={member.id} className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-foreground/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{member.fullName}</p>
                      <p className="text-xs text-foreground/60">Matrícula: {member.identifier}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => setEditingMember(member)} className="p-2 text-foreground/50 hover:text-primary rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteMember(member.id, member.fullName)} className="p-2 text-foreground/50 hover:text-destructive rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

