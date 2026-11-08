import { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TermsModal } from './TermsModal';

const COOKIE_CONSENT_KEY = 'geolimp_cookie_consent';

export function CookieConsentModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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

  if (!isVisible) {
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
        aria-label="Consentimento de Cookies e Privacidade"
        className="fixed bottom-3 sm:bottom-5 inset-x-3 sm:inset-x-6 md:left-6 md:right-auto md:max-w-xl z-[95] animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto"
      >
        <div className="bg-[#e1e4ea]/95 dark:bg-[#18181b]/95 border border-border/80 shadow-2xl backdrop-blur-2xl rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5 text-foreground">
          {/* Header & Icon */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Cookie size={22} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                  Privacidade & Uso de Cookies
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    LGPD
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-foreground/60">
                  Transparência no uso de seus dados e preferências
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAcceptEssential}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-foreground/50 hover:text-foreground transition-all cursor-pointer"
              title="Fechar (manter apenas essenciais)"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
            O GeoLimp utiliza cookies e armazenamento local para garantir a autenticação segura da sua sessão, memorizar o tema escolhido e viabilizar o registro de solicitações de zeladoria urbana, em conformidade com a <b>LGPD (Lei nº 13.709/2018)</b>. Não vendemos nem compartilhamos seus dados para fins de publicidade.
          </p>

          {/* Link to Terms */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText size={14} />
              Ver Termos de Uso e Política de Privacidade
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1 border-t border-foreground/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAcceptEssential}
              className="rounded-xl text-xs h-9 font-medium"
            >
              Apenas Essenciais
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAcceptAll}
              className="rounded-xl text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm flex items-center justify-center gap-1.5"
            >
              <ShieldCheck size={16} />
              Aceitar Todos
            </Button>
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

