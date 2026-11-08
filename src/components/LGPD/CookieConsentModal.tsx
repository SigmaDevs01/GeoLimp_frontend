import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Cookie, ShieldCheck, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TermsModal } from './TermsModal';

const COOKIE_CONSENT_KEY = 'geolimp_cookie_consent';

export function CookieConsentModal() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  useEffect(() => {
    // Verifica se o usuário já deu consentimento anteriormente
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay suave para não sobressaltar ao carregar a página
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Permite reabrir o modal a partir do menu Ajustes ou do rodapé
    const handleReopen = () => {
      setIsVisible(true);
    };

    window.addEventListener('geolimp:open-cookie-consent', handleReopen);
    return () => {
      window.removeEventListener('geolimp:open-cookie-consent', handleReopen);
    };
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential');
    setIsVisible(false);
  };

  if (!isVisible || isAuthPage) {
    return (
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    );
  }

  return (
    <>
      <div
        role="dialog"
        aria-label="Uso de Cookies"
        className="fixed bottom-3 sm:bottom-5 inset-x-3 sm:inset-x-6 md:left-6 md:right-auto md:max-w-lg z-[95] animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto"
      >
        <div className="bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border border-border/80 shadow-2xl backdrop-blur-2xl rounded-3xl p-3.5 sm:p-4 flex flex-col gap-2.5 text-foreground">
          {/* Header & Icon */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Cookie size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Uso de Cookies
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAcceptEssential}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-foreground/50 hover:text-foreground transition-all cursor-pointer"
              title="Fechar"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-foreground/75 leading-relaxed">
            Utilizamos cookies e armazenamento local para salvar suas preferências de visualização, manter sua sessão segura e melhorar sua navegação.
          </p>

          {/* Link to Terms & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1 border-t border-foreground/10">
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText size={13} />
              Termos e Privacidade
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAcceptEssential}
                className="rounded-xl text-xs h-8 px-3 font-medium"
              >
                Apenas Essenciais
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAcceptAll}
                className="rounded-xl text-xs h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm"
              >
                Aceitar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleAcceptAll}
      />
    </>
  );
}

