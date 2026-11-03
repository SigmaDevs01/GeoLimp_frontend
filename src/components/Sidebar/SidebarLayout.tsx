import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Button } from '@/components/ui/button';
import {
  User,
  LogOut,
  Sun,
  Moon,
  Map,
  Grid,
  Users,
  LayoutDashboard,
  FileText,
  Plus,
  Settings,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import { Logo } from '@/shared/components/Logo';
import { useEffect, useState } from 'react';
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

import { ServiceOrdersPanel } from '@/components/Admin/ServiceOrdersPanel';
import { ComplaintsAdminPanel } from '@/components/Admin/ComplaintsAdminPanel';
import { TeamsPanel } from '@/components/Admin/TeamsPanel';
import { ManagersPanel } from '@/components/Admin/ManagersPanel';

type SidebarTab = 'map' | 'my-complaints' | 'os' | 'complaints' | 'teams' | 'managers' | 'settings';

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

  const [activeTab, setActiveTab] = useState<SidebarTab>('map');
  const [lastOpenTab, setLastOpenTab] = useState<Exclude<SidebarTab, 'map'> | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  useEffect(() => {
    if (activeTab !== 'map') {
      setLastOpenTab(activeTab);
      return;
    }
    const timer = setTimeout(() => {
      setLastOpenTab(null);
    }, 420);
    return () => clearTimeout(timer);
  }, [activeTab]);

  if (!user) return null;

  const isCitizen = user.role === 'cidadao';
  const isPanelOpen = activeTab !== 'map';
  const displayTab = activeTab !== 'map' ? activeTab : lastOpenTab;
  const isCompactPanel = displayTab === 'settings' || displayTab === 'my-complaints';
  const targetWidthClass = isCompactPanel ? 'w-80' : 'w-[min(80vw,900px)]';
  const outerWidthClass = isPanelOpen ? targetWidthClass : 'w-0';

  const roleLabel =
    isCitizen
      ? 'Cidadão'
      : user.role === 'gestor' || user.role === 'gestor_operacional'
        ? 'Gestor'
        : 'Administrador';

  const userInitial = (user.name || user.email || 'U').charAt(0).toUpperCase();

  const handleTabClick = (tab: SidebarTab) => {
    if (tab === 'map') {
      setActiveTab('map');
      return;
    }
    setActiveTab(prev => (prev === tab ? 'map' : tab));
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <div className="absolute top-4 left-4 bottom-4 z-50 flex items-start h-[calc(100vh-2rem)] pointer-events-none">

      {/* Icon Strip (Far Left) */}
      <div
        className="bg-[#e1e4ea]/90 dark:bg-[#18181b]/90 border border-border/95 w-16 h-fit max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar shrink-0 py-5 gap-3 rounded-3xl shadow-2xl flex flex-col items-center pointer-events-auto transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <Logo className="w-8 h-8 text-foreground shrink-0" />

        <div className="w-7 h-px bg-foreground/10 shrink-0" />

        <div className="w-full flex flex-col items-center gap-3">
          <button
            onClick={() => handleTabClick('map')}
            className={`p-3 rounded-full transition-all ${activeTab === 'map' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
            title="Mapa"
          >
            <Map size={20} />
          </button>

          {isCitizen ? (
            <button
              onClick={() => handleTabClick('my-complaints')}
              className={`p-3 rounded-full transition-all ${activeTab === 'my-complaints' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
              title="Minhas Denúncias"
            >
              <Grid size={20} />
            </button>
          ) : (
            <>
              <button
                onClick={() => handleTabClick('os')}
                className={`p-3 rounded-full transition-all ${activeTab === 'os' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
                title="Ordens de Serviço (OSs)"
              >
                <FileText size={20} />
              </button>
              <button
                onClick={() => handleTabClick('complaints')}
                className={`p-3 rounded-full transition-all ${activeTab === 'complaints' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
                title="Gestão de Denúncias"
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => handleTabClick('teams')}
                className={`p-3 rounded-full transition-all ${activeTab === 'teams' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
                title="Equipes de Campo"
              >
                <Users size={20} />
              </button>
              {user.role === 'root' && (
                <button
                  onClick={() => handleTabClick('managers')}
                  className={`p-3 rounded-full transition-all ${activeTab === 'managers' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
                  title="Gestores do Sistema"
                >
                  <LayoutDashboard size={20} />
                </button>
              )}
            </>
          )}
        </div>

        <div className="w-7 h-px bg-foreground/10 shrink-0" />

        <div className="flex flex-col items-center">
          <button
            onClick={() => handleTabClick('settings')}
            className={`p-3 rounded-full transition-all ${activeTab === 'settings' ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'}`}
            title="Ajustes"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Animated Content Panel */}
      <div
        aria-hidden={!isPanelOpen}
        className={`bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border border-border/70 h-full rounded-3xl relative overflow-hidden transition-[width,margin,opacity,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${outerWidthClass} ${isPanelOpen
          ? 'ml-3 opacity-100 shadow-2xl pointer-events-auto'
          : 'ml-0 opacity-0 shadow-none !border-0 pointer-events-none'
          }`}
      >
        <div
          className={`h-full flex flex-col p-6 ${targetWidthClass} transition-[transform,opacity] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isPanelOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
            }`}
        >
          {displayTab === 'settings' && (
            <div className="flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Ajustes</h2>
                <p className="text-xs text-foreground/60 dark:text-foreground/50 mt-0.5">
                  Informações do perfil e preferências
                </p>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-5 pr-1">
                {/* Informações do Perfil */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60 dark:text-foreground/50 px-1">
                    Perfil
                  </span>
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {userInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-base leading-tight truncate">
                          {user.name || 'Usuário'}
                        </h3>
                        <span className="inline-flex items-center mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {roleLabel}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-foreground/10 space-y-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <User size={15} className="text-foreground/50 dark:text-foreground/40 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-foreground/60 dark:text-foreground/50 block">Nome</span>
                          <span className="text-foreground font-medium break-words">
                            {user.name || 'Não informado'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Mail size={15} className="text-foreground/50 dark:text-foreground/40 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-foreground/60 dark:text-foreground/50 block">E-mail</span>
                          <span className="text-foreground font-medium break-all">
                            {user.email || 'Não informado'}
                          </span>
                        </div>
                      </div>

                      {user.phone && (
                        <div className="flex items-start gap-2.5">
                          <Phone size={15} className="text-foreground/50 dark:text-foreground/40 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-foreground/60 dark:text-foreground/50 block">Telefone</span>
                            <span className="text-foreground font-medium break-words">
                              {user.phone}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2.5">
                        <Shield size={15} className="text-foreground/50 dark:text-foreground/40 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-foreground/60 dark:text-foreground/50 block">Nível de Acesso</span>
                          <span className="text-foreground font-medium">
                            {roleLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aparência / Modo Escuro */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60 dark:text-foreground/50 px-1">
                    Aparência
                  </span>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-full p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 hover:border-foreground/20 transition-all flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center text-foreground shrink-0">
                        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-sm font-semibold text-foreground block">
                          Modo Escuro
                        </span>
                        <span className="text-xs text-foreground/60 dark:text-foreground/50 block">
                          {theme === 'dark' ? 'Ativado' : 'Desativado'}
                        </span>
                      </div>
                    </div>

                    <div
                      role="switch"
                      aria-checked={theme === 'dark'}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 flex items-center ${theme === 'dark' ? 'bg-emerald-500' : 'bg-black/25 dark:bg-white/20'
                        }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </div>
                  </button>
                </div>
              </div>

              {/* Botão de Sair */}
              <div className="pt-4 mt-4 border-t border-foreground/10">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full h-11 px-4 rounded-2xl bg-red-500/10 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut size={18} />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}

          {displayTab === 'my-complaints' && user.role === 'cidadao' && (
            <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Minhas Denúncias</h2>
                <Button
                  size="sm"
                  onClick={() => {
                    setActiveTab('map');
                    onAddComplaint?.();
                  }}
                  className="rounded-full shadow-md"
                >
                  <Plus size={16} className="mr-1" /> Nova
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-3 custom-scrollbar">
                {userComplaints.length === 0 ? (
                  <p className="text-sm text-foreground/60 dark:text-foreground/50">Você ainda não fez nenhuma denúncia.</p>
                ) : (
                  userComplaints.map(comp => (
                    <div
                      key={comp.id}
                      onClick={() => {
                        setActiveTab('map');
                        onComplaintSelect(comp);
                      }}
                      className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 hover:border-primary/50 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider truncate mr-2">{comp.category}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${(comp.status?.toUpperCase() === 'RESOLVIDA' || comp.status?.toUpperCase() === 'RESOLVIDO' || comp.status?.toUpperCase() === 'CONCLUIDA') ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                          (comp.status?.toUpperCase() === 'EM_ANDAMENTO') ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                            'bg-yellow-500/20 text-amber-700 dark:text-yellow-400'
                          }`}>
                          {(comp.status?.toUpperCase() === 'RESOLVIDO' || comp.status?.toUpperCase() === 'CONCLUIDA'
                            ? 'RESOLVIDA'
                            : comp.status)?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 font-medium line-clamp-1">{comp.address}</p>
                      <p className="text-xs text-foreground/70 dark:text-foreground/60 mt-1 line-clamp-2">{comp.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {user.role !== 'cidadao' && !isCompactPanel && displayTab && (
            <div className="flex-1 h-full w-full min-h-0">
              {displayTab === 'os' && <ServiceOrdersPanel />}
              {displayTab === 'complaints' && <ComplaintsAdminPanel onComplaintSelect={onComplaintSelect} />}
              {displayTab === 'teams' && <TeamsPanel />}
              {displayTab === 'managers' && <ManagersPanel />}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Logout */}
      <AlertDialog
        open={showLogoutConfirm}
        onOpenChange={(open) => {
          if (!isLoggingOut) setShowLogoutConfirm(open);
        }}
      >
        <AlertDialogContent className="z-[110] max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja encerrar sua sessão no sistema?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut} className="rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmLogout();
              }}
              disabled={isLoggingOut}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              {isLoggingOut ? 'Saindo...' : 'Sim, sair'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
