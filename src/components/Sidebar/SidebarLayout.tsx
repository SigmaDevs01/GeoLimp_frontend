import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Button } from '@/components/ui/button';
import { User, LogOut, Sun, Moon, MapPin, Grid, Users, LayoutDashboard, Search, FileText, Plus } from 'lucide-react';
import { Logo } from '@/shared/components/Logo';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

import { ServiceOrdersPanel } from '@/components/Admin/ServiceOrdersPanel';
import { ComplaintsAdminPanel } from '@/components/Admin/ComplaintsAdminPanel';
import { TeamsPanel } from '@/components/Admin/TeamsPanel';
import { ManagersPanel } from '@/components/Admin/ManagersPanel';

export function SidebarLayout({ 
  onComplaintSelect,
  onAddComplaint,
  userComplaints = []
}: { 
  onComplaintSelect: (complaint: any) => void;
  onAddComplaint?: () => void;
  userComplaints?: any[];
}) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  const [activeTab, setActiveTab] = useState<'map'|'os'|'complaints'|'teams'|'managers'>('map');

  if (!user) return null;

  // Cidadão has fixed width. Admin expands when not on map.
  const isExpanded = user.role !== 'cidadao' && activeTab !== 'map';
  const panelWidthClass = isExpanded ? 'w-[80vw] max-w-[900px]' : 'w-80';

  useEffect(() => {
    const handleOpenOsTab = () => setActiveTab('os');
    const handleOpenComplaintsTab = () => setActiveTab('complaints');
    const handleOpenMapTab = () => setActiveTab('map');
    
    window.addEventListener('open-os-tab', handleOpenOsTab);
    window.addEventListener('open-complaints-tab', handleOpenComplaintsTab);
    window.addEventListener('open-map-tab', handleOpenMapTab);
    
    return () => {
      window.removeEventListener('open-os-tab', handleOpenOsTab);
      window.removeEventListener('open-complaints-tab', handleOpenComplaintsTab);
      window.removeEventListener('open-map-tab', handleOpenMapTab);
    };
  }, []);

  return (
    <div className="absolute top-4 left-4 bottom-4 z-50 flex h-[calc(100vh-2rem)] pointer-events-none">
      
      {/* Icon Strip (Far Left) */}
      <div className="glass-panel glass-blur w-16 h-full rounded-l-3xl border-r border-r-black/5 dark:border-r-white/5 flex flex-col items-center py-6 gap-6 pointer-events-auto shadow-none">
        <Logo className="w-8 h-8 text-foreground" />
        
        <div className="flex-1 w-full flex flex-col items-center gap-4 mt-8">
          <button 
            onClick={() => setActiveTab('map')}
            className={`p-3 rounded-full transition-all ${activeTab === 'map' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
            title="Mapa / Perfil"
          >
            <MapPin size={20} />
          </button>
          
          {user.role !== 'cidadao' && (
            <>
              <button 
                onClick={() => setActiveTab('os')}
                className={`p-3 rounded-full transition-all ${activeTab === 'os' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
                title="Ordens de Serviço (OSs)"
              >
                <FileText size={20} />
              </button>
              <button 
                onClick={() => setActiveTab('complaints')}
                className={`p-3 rounded-full transition-all ${activeTab === 'complaints' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
                title="Gestão de Denúncias"
              >
                <Grid size={20} />
              </button>
              <button 
                onClick={() => setActiveTab('teams')}
                className={`p-3 rounded-full transition-all ${activeTab === 'teams' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
                title="Equipes de Campo"
              >
                <Users size={20} />
              </button>
              {user.role === 'root' && (
                <button 
                  onClick={() => setActiveTab('managers')}
                  className={`p-3 rounded-full transition-all ${activeTab === 'managers' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
                  title="Gestores do Sistema"
                >
                  <LayoutDashboard size={20} />
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button onClick={toggleTheme} className="p-3 rounded-full text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={logout} className="p-3 rounded-full text-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Content Panel (Animates Width) */}
      <div 
        className={`glass-panel glass-blur h-full rounded-r-3xl flex flex-col p-6 pointer-events-auto shadow-2xl border-l-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${panelWidthClass} relative overflow-hidden`}
      >
        
        {/* Render Map/Profile View if activeTab === 'map' OR user is cidadao */}
        {(activeTab === 'map' || user.role === 'cidadao') ? (
          <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* User Profile Info */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{user.name}</h3>
                <span className="text-xs text-foreground/50 capitalize truncate block">
                  {user.role === 'cidadao' ? 'Cidadão' : user.role === 'gestor_operacional' ? 'Gestor' : 'Administrador'}
                </span>
              </div>
            </div>

            {/* Minhas Denúncias (Only for cidadao) */}
            {user.role === 'cidadao' ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Minhas Denúncias</h2>
                  <Button size="sm" onClick={onAddComplaint} className="rounded-full shadow-md"><Plus size={16} className="mr-1" /> Nova</Button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {userComplaints.length === 0 ? (
                    <p className="text-sm text-foreground/50">Você ainda não fez nenhuma denúncia.</p>
                  ) : (
                    userComplaints.map(comp => (
                      <div 
                        key={comp.id}
                        onClick={() => onComplaintSelect(comp)}
                        className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 hover:border-primary/50 cursor-pointer transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider truncate mr-2">{comp.category}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                            (comp.status === 'RESOLVIDA' || comp.status === 'resolvido') ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                            (comp.status === 'EM_ANDAMENTO' || comp.status === 'em_andamento') ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                            'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {comp.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 font-medium line-clamp-1">{comp.address}</p>
                        <p className="text-xs text-foreground/60 mt-1 line-clamp-2">{comp.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <MapPin size={48} className="mb-4" />
                <p>Navegue pelo mapa ou selecione<br/>um módulo administrativo ao lado.</p>
              </div>
            )}
          </div>
        ) : (
          // Admin Panels
          <div className="flex-1 h-full w-full">
            {activeTab === 'os' && <ServiceOrdersPanel />}
            {activeTab === 'complaints' && <ComplaintsAdminPanel onComplaintSelect={onComplaintSelect} />}
            {activeTab === 'teams' && <TeamsPanel />}
            {activeTab === 'managers' && <ManagersPanel />}
          </div>
        )}

      </div>
    </div>
  );
}
