import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

export function TeamsPanel() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
    fetchTeams();
  }, []);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipes de Campo</h2>
          <p className="text-foreground/60 text-sm mt-1">Gestão de equipes e profissionais terceirizados</p>
        </div>
        <Button className="rounded-full shadow-lg"><Plus size={18} className="mr-2" /> Nova Equipe</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-auto custom-scrollbar pr-2 pb-4 content-start">
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
                </div>
                <p className="text-sm text-foreground/70 mb-4">{team.description || 'Sem descrição.'}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-foreground/10">
                <span className="text-xs font-semibold text-foreground/50">
                  {/* Ideally backend returns _count.professionals */}
                  Profissionais vinculados
                </span>
                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity">Ver Membros</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
