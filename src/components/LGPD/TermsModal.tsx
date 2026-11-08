import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  X,
  ExternalLink,
  FileText,
  UserCheck,
  MapPin,
  Lock,
  Cookie,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleOpenFullPage = () => {
    onClose();
    navigate('/termos');
  };

  const handleAccept = () => {
    if (onAccept) onAccept();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#e1e4ea] dark:bg-[#18181b] border border-border/80 shadow-2xl rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-foreground animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-foreground/10 flex items-center justify-between shrink-0 bg-background/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Termos de Uso & Política de Privacidade
              </h2>
              <p className="text-xs text-foreground/60">
                Conformidade com a LGPD (Lei nº 13.709/2018)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-foreground/60 hover:text-foreground transition-all cursor-pointer"
            title="Fechar"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-foreground/80 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
            💡 <b>Transparência e Compromisso Público:</b> O GeoLimp respeita sua privacidade e protege seus dados em total consonância com os princípios da Lei Geral de Proteção de Dados Pessoais.
          </div>

          {/* Seção 1 */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <FileText size={16} className="text-primary shrink-0" />
              1. Apresentação e Finalidade do Serviço
            </h3>
            <p>
              O <b>GeoLimp</b> é uma plataforma tecnológica colaborativa voltada à zeladoria urbana, sustentabilidade e gestão pública municipal de resíduos sólidos. O objetivo do sistema é permitir que cidadãos registrem ocorrências e que as equipes e gestores municipais organizem Ordens de Serviço (OS) com eficiência.
            </p>
          </div>

          {/* Seção 2 */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <UserCheck size={16} className="text-primary shrink-0" />
              2. Dados Coletados e Finalidade do Tratamento
            </h3>
            <p>
              Para o registro e acompanhamento de denúncias, coletamos exclusivamente os dados necessários para o atendimento público:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/75">
              <li>
                <b>Nome e Telefone (WhatsApp):</b> identificação do solicitante para envio de notificações sobre o status da solicitação e emissão de protocolos de atendimento.
              </li>
              <li>
                <b>Localização Geográfica (GPS e Endereço):</b> dados espaciais da ocorrência para deslocamento correto das equipes de campo.
              </li>
              <li>
                <b>Registros Fotográficos e Descrições:</b> evidências visuais enviadas para triagem e execução das ações de limpeza urbana.
              </li>
              <li>
                <b>E-mail e Senha (usuários cadastrados):</b> credenciais estritamente para autenticação segura no portal web.
              </li>
            </ul>
          </div>

          {/* Seção 3 */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Lock size={16} className="text-primary shrink-0" />
              3. Base Legal para o Tratamento (LGPD - Arts. 7º e 23)
            </h3>
            <p>
              O tratamento de dados pessoais no GeoLimp fundamenta-se no <b>Art. 7º, incisos II e III, e Art. 23 da Lei nº 13.709/2018 (LGPD)</b>, destinados ao cumprimento de obrigações legais e regulatórias e à execução de políticas públicas pela administração pública municipal.
            </p>
          </div>

          {/* Seção 4 */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <MapPin size={16} className="text-primary shrink-0" />
              4. Compartilhamento e Sigilo dos Dados
            </h3>
            <p>
              Seus dados pessoais <b>jamais serão vendidos, alugados ou compartilhados para fins comerciais ou publicitários</b>. O acesso às informações é restrito a gestores públicos e equipes operacionais credenciadas e encarregadas da resolução da ocorrência.
            </p>
          </div>

          {/* Seção 5 */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Trash2 size={16} className="text-primary shrink-0" />
              5. Seus Direitos como Titular de Dados (Art. 18)
            </h3>
            <p>
              Conforme preconiza a LGPD, o titular de dados possui direitos claros e acessíveis:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/75">
              <li>Confirmação da existência de tratamento e acesso aos dados cadastrados.</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>
                <b>Direito de Exclusão da Conta:</b> Você pode a qualquer momento excluir sua conta diretamente na aba <b>Ajustes</b>. Seus dados pessoais serão permanentemente deletados do servidor, mantendo-se os registros técnicos da denúncia de forma 100% anônima para preservar a prestação do serviço público.
              </li>
            </ul>
          </div>

          {/* Seção 6 */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Cookie size={16} className="text-primary shrink-0" />
              6. Uso de Cookies e Armazenamento Local
            </h3>
            <p>
              Utilizamos cookies essenciais e recursos de <code>localStorage</code> estritamente para manter a integridade da sua sessão segura e lembrar suas preferências de uso (como modo claro ou escuro). Não empregamos cookies invasivos de terceiros para rastreamento publicitário.
            </p>
          </div>

          {/* Seção 7 */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary shrink-0" />
              7. Contato e Encarregado pelo Tratamento (DPO)
            </h3>
            <p>
              Para esclarecer dúvidas sobre esta Política ou exercer qualquer dos direitos previstos na LGPD, você pode entrar em contato diretamente pelo canal de suporte ou pelo bot do WhatsApp do GeoLimp.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-background/40 shrink-0">
          <button
            type="button"
            onClick={handleOpenFullPage}
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink size={14} />
            Visualizar página completa de termos
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-xl"
            >
              Fechar
            </Button>
            {onAccept && (
              <Button
                onClick={handleAccept}
                className="flex-1 sm:flex-none rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Entendido e Concordo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

