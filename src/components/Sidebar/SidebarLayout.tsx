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
  X,
} from 'lucide-react';
import { Logo } from '@/shared/components/Logo';
import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useSocketStore } from '@/store/useSocketStore';
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
  const sidebarContainerRef = useRef<HTMLDivElement>(null);

  // Estados para paginação de denúncias do Cidadão (10 iniciais + Ver mais)
  const [citizenComplaints, setCitizenComplaints] = useState<any[]>([]);
  const [citizenPage, setCitizenPage] = useState(1);
  const [citizenHasMore, setCitizenHasMore] = useState(false);
  const [citizenTotal, setCitizenTotal] = useState(0);
  const [citizenLoading, setCitizenLoading] = useState(false);
  const [citizenLoadingMore, setCitizenLoadingMore] = useState(false);
  const { socket } = useSocketStore();

  const fetchCitizenComplaints = useCallback(async (targetPage = 1, append = false) => {
    if (!user || user.role !== 'cidadao') return;
    if (append) {
      setCitizenLoadingMore(true);
    } else {
      setCitizenLoading(true);
    }
    try {
      const res = await api.get('/complaints/mine', { params: { page: targetPage, limit: 10 } });
      const data = res.data?.data ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      const more = res.data?.hasMore ?? false;
      const totalCount = res.data?.total ?? (Array.isArray(res.data) ? res.data.length : data.length);

      if (append) {
        setCitizenComplaints(prev => {
          const ids = new Set(prev.map(c => c.id));
          const newUnique = data.filter((item: any) => !ids.has(item.id));
          return [...prev, ...newUnique];
        });
      } else {
        setCitizenComplaints(data);
      }
      setCitizenPage(targetPage);
      setCitizenHasMore(more);
      setCitizenTotal(totalCount);
    } catch (e) {
      console.error('Erro ao buscar denúncias do cidadão:', e);
    } finally {
      setCitizenLoading(false);
      setCitizenLoadingMore(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'cidadao') {
      fetchCitizenComplaints(1, false);
    }
  }, [fetchCitizenComplaints, user?.role]);

  useEffect(() => {
    if (user?.role === 'cidadao' && citizenPage === 1 && userComplaints.length > 0) {
      fetchCitizenComplaints(1, false);
    }
  }, [userComplaints.length]);

  useEffect(() => {
    if (!socket || user?.role !== 'cidadao') return;

    const handleNewItem = (item: any) => {
      if (item.type === 'OS') return;
      if (item.userId && item.userId !== user.id) return;
      setCitizenComplaints(prev => {
        if (prev.find(c => c.id === item.id)) return prev;
        return [item, ...prev];
      });
      setCitizenTotal(prev => prev + 1);
    };

    const handleUpdateItem = (item: any) => {
      if (item.type === 'OS') return;
      setCitizenComplaints(prev =>
        prev.map(c => (c.id === item.id ? { ...c, ...item } : c))
      );
    };

    const handleDeleteItem = (item: { id: string; type: string }) => {
      setCitizenComplaints(prev => prev.filter(c => c.id !== item.id));
      setCitizenTotal(prev => Math.max(0, prev - 1));
    };

    socket.on('new_map_item', handleNewItem);
    socket.on('update_map_item', handleUpdateItem);
    socket.on('delete_map_item', handleDeleteItem);

    return () => {
      socket.off('new_map_item', handleNewItem);
      socket.off('update_map_item', handleUpdateItem);
      socket.off('delete_map_item', handleDeleteItem);
    };
  }, [socket, user]);

  // Fechar aba aberta e voltar para o mapa ao clicar fora do painel lateral
  useEffect(() => {
    if (activeTab === 'map') return;

    const handleClickOutside = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Se há qualquer modal/diálogo aberto no documento, não fecha a aba lateral
      const hasActiveModal = Boolean(
        document.querySelector('[role="dialog"], [role="alertdialog"], [data-modal="true"], .image-gallery-modal, .image-gallery-overlay')
      );
      if (hasActiveModal) {
        return;
      }

      // Se clicou dentro do próprio menu lateral ou do painel de conteúdo, não fecha
      if (sidebarContainerRef.current && sidebarContainerRef.current.contains(target)) {
        return;
      }

      // Ignora se o clique foi dentro de modais, diálogos, overlays ou dropdowns em portal
      const isInsideModalOrPortal = target.closest(
        '[role="dialog"], [role="alertdialog"], [data-radix-portal], [data-radix-popper-content-wrapper], [data-modal="true"], [data-portal="true"], .image-gallery-modal, .image-gallery-overlay'
      );
      if (isInsideModalOrPortal) {
        return;
      }

      // Clicou fora (no mapa ou fundo): fecha e volta para o mapa
      setActiveTab('map');
    };

    window.addEventListener('pointerdown', handleClickOutside, true);
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [activeTab]);

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

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('sidebar-state-change', {
        detail: { isOpen: activeTab !== 'map', tab: activeTab },
      })
    );
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

  const renderPanelContent = (_isMobile = false) => (
    <>
      {displayTab === 'settings' && (
        <div className="flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="hidden md:block mb-4 sm:mb-6">
            <h2 className="text-xl font-bold text-foreground">Ajustes</h2>
            <p className="text-xs text-foreground/60 dark:text-foreground/50 mt-0.5">
              Informações do perfil e preferências
            </p>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-3 sm:space-y-4 pr-1">
            {/* Informações do Perfil */}
            <div className="space-y-1.5 sm:space-y-2">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-foreground/60 dark:text-foreground/50 px-1">
                Perfil
              </span>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-base sm:text-lg shrink-0">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight truncate">
                      {user.name || 'Usuário'}
                    </h3>
                    <span className="inline-flex items-center mt-0.5 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 sm:pt-3 border-t border-foreground/10 space-y-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <User size={14} className="text-foreground/50 dark:text-foreground/40 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] sm:text-xs text-foreground/60 dark:text-foreground/50 block">Nome</span>
                      <span className="text-foreground font-medium text-xs break-words">
                        {user.name || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail size={14} className="text-foreground/50 dark:text-foreground/40 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] sm:text-xs text-foreground/60 dark:text-foreground/50 block">E-mail</span>
                      <span className="text-foreground font-medium text-xs break-all">
                        {user.email || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-start gap-2">
                      <Phone size={14} className="text-foreground/50 dark:text-foreground/40 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] sm:text-xs text-foreground/60 dark:text-foreground/50 block">Telefone</span>
                        <span className="text-foreground font-medium text-xs break-words">
                          {user.phone}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Shield size={14} className="text-foreground/50 dark:text-foreground/40 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] sm:text-xs text-foreground/60 dark:text-foreground/50 block">Nível de Acesso</span>
                      <span className="text-foreground font-medium text-xs">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aparência / Modo Escuro */}
            <div className="space-y-1.5 sm:space-y-2">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-foreground/60 dark:text-foreground/50 px-1">
                Aparência
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full p-3 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 hover:border-foreground/20 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center text-foreground shrink-0">
                    {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-foreground block">
                      Modo Escuro
                    </span>
                    <span className="text-[10px] sm:text-xs text-foreground/60 dark:text-foreground/50 block">
                      {theme === 'dark' ? 'Ativado' : 'Desativado'}
                    </span>
                  </div>
                </div>

                <div
                  role="switch"
                  aria-checked={theme === 'dark'}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 flex items-center ${
                    theme === 'dark' ? 'bg-emerald-500' : 'bg-black/25 dark:bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                      theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Botão de Sair */}
          <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-foreground/10">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full h-9 sm:h-11 px-4 rounded-2xl bg-red-500/10 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}

      {displayTab === 'my-complaints' && user.role === 'cidadao' && (
        <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="hidden md:block">
              <h2 className="text-lg font-semibold text-foreground">Minhas Denúncias</h2>
              {citizenTotal > 0 && (
                <p className="text-[11px] text-foreground/50">
                  Exibindo {citizenComplaints.length} de {citizenTotal}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => {
                setActiveTab('map');
                onAddComplaint?.();
              }}
              className="rounded-full shadow-md text-xs h-7.5 px-3"
            >
              <Plus size={14} className="mr-1" /> Nova
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 space-y-2.5 sm:space-y-3 custom-scrollbar">
            {citizenLoading && citizenComplaints.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-foreground/50 gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                <span className="text-xs">Carregando denúncias...</span>
              </div>
            ) : citizenComplaints.length === 0 ? (
              <p className="text-xs sm:text-sm text-foreground/60 dark:text-foreground/50">Você ainda não fez nenhuma denúncia.</p>
            ) : (
              <>
                {citizenComplaints.map(comp => (
                  <div
                    key={comp.id}
                    onClick={() => {
                      setActiveTab('map');
                      onComplaintSelect(comp);
                    }}
                    className="p-3 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-foreground/10 hover:border-primary/50 cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider truncate mr-2">{comp.category}</span>
                      <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium shrink-0 ${(comp.status?.toUpperCase() === 'RESOLVIDA' || comp.status?.toUpperCase() === 'RESOLVIDO' || comp.status?.toUpperCase() === 'CONCLUIDA') ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                        (comp.status?.toUpperCase() === 'EM_ANDAMENTO') ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                          'bg-yellow-500/20 text-amber-700 dark:text-yellow-400'
                        }`}>
                        {(comp.status?.toUpperCase() === 'RESOLVIDO' || comp.status?.toUpperCase() === 'CONCLUIDA'
                          ? 'RESOLVIDA'
                          : comp.status)?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/90 font-medium line-clamp-1">{comp.address}</p>
                    <p className="text-[11px] sm:text-xs text-foreground/70 dark:text-foreground/60 mt-0.5 line-clamp-2">{comp.description}</p>
                  </div>
                ))}

                {/* Botão Ver mais (Carregar mais 10) */}
                {citizenHasMore && (
                  <div className="pt-2 pb-3 flex justify-center">
                    <Button
                      variant="outline"
                      disabled={citizenLoadingMore}
                      onClick={() => fetchCitizenComplaints(citizenPage + 1, true)}
                      className="w-full py-3.5 sm:py-4 rounded-xl border-foreground/10 hover:border-primary/50 hover:bg-primary/5 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {citizenLoadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary" />
                          <span>Carregando...</span>
                        </>
                      ) : (
                        <>
                          <span>Ver mais</span>
                          <span className="text-[10px] text-foreground/50 font-normal">
                            ({citizenComplaints.length} de {citizenTotal})
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
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
    </>
  );

  return (
    <div ref={sidebarContainerRef} className="pointer-events-none">

      {/* Desktop Layout (Vertical Strip on the left + Sliding Panel) */}
      <div className="hidden md:flex absolute top-4 left-4 bottom-4 z-50 items-start h-[calc(100vh-2rem)] pointer-events-none">
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
            {renderPanelContent(false)}
          </div>
        </div>
      </div>

      {/* Mobile Floating Navigation Pill (Bottom Bar) */}
      <div className="flex md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto items-center gap-1.5 p-1.5 rounded-full bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border border-border/80 shadow-2xl backdrop-blur-xl max-w-[calc(100vw-2rem)]">
        <button
          onClick={() => handleTabClick('map')}
          className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
            activeTab === 'map'
              ? 'bg-primary/15 text-primary scale-105 shadow-sm font-semibold'
              : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'
          }`}
          title="Mapa"
          aria-label="Mapa"
        >
          <Map size={20} />
        </button>

        {isCitizen ? (
          <button
            onClick={() => handleTabClick('my-complaints')}
            className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === 'my-complaints'
                ? 'bg-primary/15 text-primary scale-105 shadow-sm font-semibold'
                : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'
            }`}
            title="Minhas Denúncias"
            aria-label="Minhas Denúncias"
          >
            <Grid size={20} />
          </button>
        ) : (
          <>
            <button
              onClick={() => handleTabClick('os')}
              className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                activeTab === 'os'
                  ? 'bg-primary/15 text-primary scale-105 shadow-sm font-semibold'
                  : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'
              }`}
              title="Ordens de Serviço (OSs)"
              aria-label="Ordens de Serviço"
            >
              <FileText size={20} />
            </button>
            <button
              onClick={() => handleTabClick('complaints')}
              className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                activeTab === 'complaints'
                  ? 'bg-primary/15 text-primary scale-105 shadow-sm font-semibold'
                  : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'
              }`}
              title="Gestão de Denúncias"
              aria-label="Gestão de Denúncias"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => handleTabClick('teams')}
              className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                activeTab === 'teams'
                  ? 'bg-primary/15 text-primary scale-105 shadow-sm font-semibold'
                  : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'
              }`}
              title="Equipes de Campo"
              aria-label="Equipes de Campo"
            >
              <Users size={20} />
            </button>
            {user.role === 'root' && (
              <button
                onClick={() => handleTabClick('managers')}
                className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === 'managers'
                    ? 'bg-primary/15 text-primary scale-105 shadow-sm font-semibold'
                    : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'
                }`}
                title="Gestores do Sistema"
                aria-label="Gestores do Sistema"
              >
                <LayoutDashboard size={20} />
              </button>
            )}
          </>
        )}

        <div className="w-px h-5 bg-foreground/15 mx-0.5 shrink-0" />

        <button
          onClick={() => handleTabClick('settings')}
          className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-primary/15 text-primary scale-105 shadow-sm font-semibold'
              : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'
          }`}
          title="Ajustes"
          aria-label="Ajustes"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Mobile Floating Content Panel */}
      {isPanelOpen && (
        <div
          className="md:hidden fixed inset-x-3 top-16 bottom-20 z-40 rounded-3xl bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border border-border/80 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
        >
          {/* Mobile Top Header Bar with Close Button, Title & Subtitle */}
          <div className="relative pt-3.5 px-4 pb-2.5 flex items-center justify-between border-b border-foreground/10 shrink-0">
            <div className="w-10 h-1 rounded-full bg-foreground/20 mx-auto absolute left-1/2 -translate-x-1/2 top-1.5" />
            <div className="min-w-0 pr-2">
              <h3 className="text-sm font-bold text-foreground truncate">
                {displayTab === 'settings'
                  ? 'Ajustes'
                  : displayTab === 'my-complaints'
                  ? 'Minhas Denúncias'
                  : displayTab === 'os'
                  ? 'Ordens de Serviço'
                  : displayTab === 'complaints'
                  ? 'Gestão de Denúncias'
                  : displayTab === 'teams'
                  ? 'Equipes de Campo'
                  : displayTab === 'managers'
                  ? 'Gestores do Sistema'
                  : ''}
              </h3>
              <p className="text-[10px] text-foreground/50 truncate">
                {displayTab === 'settings'
                  ? 'Informações do perfil e preferências'
                  : displayTab === 'my-complaints'
                  ? citizenTotal > 0 ? `Exibindo ${citizenComplaints.length} de ${citizenTotal}` : 'Acompanhe suas solicitações'
                  : displayTab === 'os'
                  ? 'Gerencie a execução das equipes de campo'
                  : displayTab === 'complaints'
                  ? 'Visão geral de todas as denúncias'
                  : displayTab === 'teams'
                  ? 'Gestão de equipes e profissionais terceirizados'
                  : displayTab === 'managers'
                  ? 'Administradores e usuários com privilégios'
                  : ''}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('map')}
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-foreground/50 hover:text-foreground transition-all cursor-pointer shrink-0"
              title="Voltar ao mapa"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
            {renderPanelContent(true)}
          </div>
        </div>
      )}

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
