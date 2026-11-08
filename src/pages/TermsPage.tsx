import { useNavigate } from 'react-router-dom';
import { Logo } from '@/shared/components/Logo';
import { useThemeStore } from '@/store/useThemeStore';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Sun,
  Moon,
  ShieldCheck,
  Lock,
  UserCheck,
  FileText,
  MapPin,
  Trash2,
  Cookie,
  Mail,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

export function TermsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="h-full w-full overflow-y-auto bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-foreground/10 px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="rounded-xl flex items-center gap-1.5 text-foreground/80 hover:text-foreground"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Voltar ao Mapa</span>
          </Button>

          <div className="h-5 w-px bg-foreground/15 hidden sm:block" />

          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <Logo showName className="h-8 w-auto text-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-9 h-9"
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/')}
            className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm"
          >
            Acessar Sistema
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Hero Section */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={15} />
            Conformidade com a LGPD (Lei Federal nº 13.709/2018)
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Termos de Uso e Política de Privacidade
          </h1>

          <p className="text-sm sm:text-base text-foreground/70 max-w-2xl leading-relaxed">
            Transparência e segurança no tratamento de seus dados na plataforma <b>GeoLimp</b>. Entenda como coletamos, protegemos e utilizamos suas informações na gestão colaborativa da limpeza urbana.
          </p>

          <div className="text-xs text-foreground/50 pt-1">
            Última atualização: <b>Novembro de 2026</b>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Finalidade Pública</h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Tratamento voltado exclusivamente para fiscalização, zeladoria e execução de serviços de limpeza urbana.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
              <Lock size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Sigilo e Proteção</h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Não vendemos nem compartilhamos seus dados cadastrais para fins de publicidade comercial ou terceiros.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 shrink-0">
              <Trash2 size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Exclusão Descomplicada</h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Direito de exclusão total da conta a qualquer momento na aba Ajustes, com anonimização técnica imediata.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Cookie size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Cookies Essenciais</h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Armazenamento local apenas para segurança, autenticação e preferências visuais de navegação.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 bg-card/60 border border-border/80 rounded-3xl p-6 sm:p-10 shadow-sm text-foreground/85 leading-relaxed text-sm sm:text-base">
          {/* Seção 1 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-foreground/10 pb-2">
              <FileText size={18} className="text-primary shrink-0" />
              1. Apresentação e Escopo do Serviço
            </h2>
            <p>
              O <b>GeoLimp</b> é um sistema inteligente de gestão pública e zeladoria urbana desenvolvido para facilitar o mapeamento de focos irregulares de resíduos sólidos, entulhos, terrenos baldios abandonados e podas em vias públicas.
            </p>
            <p>
              Através de múltiplos canais de comunicação — portal web e assistente automatizado via WhatsApp — o cidadão participa ativamente do cuidado com a cidade e acompanha em tempo real o andamento das Ordens de Serviço (OS) geradas.
            </p>
          </section>

          {/* Seção 2 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-foreground/10 pb-2">
              <UserCheck size={18} className="text-primary shrink-0" />
              2. Dados Pessoais Coletados e Finalidade
            </h2>
            <p>
              O GeoLimp coleta unicamente os dados necessários para garantir a eficácia do serviço público solicitado:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-foreground/80">
              <li>
                <b>Nome do Cidadão:</b> Utilizado para identificar formalmente o autor do chamado perante o sistema e emitir comprovantes de atendimento.
              </li>
              <li>
                <b>Número de Telefone (WhatsApp):</b> Canal primário de comunicação para envio do protocolo de registro, avisos automáticos de mudança de status e confirmação da resolução da limpeza.
              </li>
              <li>
                <b>Endereço de E-mail (quando cadastrado no portal):</b> Utilizado para login seguro e recuperação de credenciais de acesso.
              </li>
              <li>
                <b>Coordenadas Geográficas (GPS) e Endereço:</b> Dados geográficos cruciais para que as equipes operacionais localizem com precisão o ponto de descarte ou irregularidade na cidade.
              </li>
              <li>
                <b>Fotos e Evidências Visuais:</b> Fotografias enviadas pelo cidadão para fundamentar a solicitação e permitir a triagem do maquinário adequado (caminhões caçamba, retroescavadeiras ou equipes manuais).
              </li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-foreground/10 pb-2">
              <Lock size={18} className="text-primary shrink-0" />
              3. Base Legal para o Tratamento (LGPD - Arts. 7º e 23)
            </h2>
            <p>
              O tratamento dos dados pessoais coletados pelo GeoLimp está respaldado pelas seguintes hipóteses da Lei nº 13.709/2018:
            </p>
            <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/10 space-y-2 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  <b>Art. 7º, II:</b> Cumprimento de obrigação legal e regulatória pelo controlador;
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  <b>Art. 7º, III e Art. 23:</b> Execução de políticas públicas previstas em leis, contratos e convênios pelos órgãos públicos de saneamento, zeladoria e meio ambiente;
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  <b>Art. 7º, I:</b> Consentimento livre, informado e inequívoco do titular ao registrar denúncias e interagir com o bot.
                </span>
              </div>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-foreground/10 pb-2">
              <MapPin size={18} className="text-primary shrink-0" />
              4. Compartilhamento e Sigilo dos Dados
            </h2>
            <p>
              Os dados coletados são de uso estritamente institucional. O acesso é restrito a:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-foreground/80">
              <li>Gestores públicos e administradores municipais credenciados;</li>
              <li>Equipes operacionais terceirizadas ou servidores públicos encarregados da limpeza;</li>
              <li>Órgãos de fiscalização ambiental quando exigido por processo formal.</li>
            </ul>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
              É estritamente vedada a venda, locação ou cessão onerosa de dados pessoais a empresas privadas ou redes de publicidade.
            </p>
          </section>

          {/* Seção 5 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-foreground/10 pb-2">
              <Trash2 size={18} className="text-primary shrink-0" />
              5. Direitos do Titular de Dados (Art. 18 da LGPD)
            </h2>
            <p>
              O cidadão pode a qualquer momento exercer seus direitos fundamentais:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-foreground/80">
              <li><b>Acesso e Confirmação:</b> Saber se seus dados estão sendo tratados e consultá-los;</li>
              <li><b>Correção:</b> Atualizar seu telefone, nome ou e-mail na área de Ajustes;</li>
              <li>
                <b>Exclusão de Conta:</b> O usuário tem total autonomia para apagar sua conta a qualquer momento na aba <i>Ajustes &gt; Excluir minha conta</i>. O sistema removerá permanentemente os identificadores pessoais do banco de dados, preservando os dados espaciais da denúncia de forma 100% anonimizada para não prejudicar o histórico de atendimento público da cidade.
              </li>
            </ul>
          </section>

          {/* Seção 6 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-foreground/10 pb-2">
              <Cookie size={18} className="text-primary shrink-0" />
              6. Uso de Cookies e Armazenamento Local
            </h2>
            <p>
              Nossa aplicação utiliza cookies essenciais e a memória local do navegador (<code>localStorage</code>) exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-foreground/80">
              <li>Manter o cidadão autenticado de forma segura entre sessões;</li>
              <li>Memorizar o tema visual (modo claro ou modo escuro);</li>
              <li>Registrar a manifestação de ciência e consentimento sobre os termos LGPD.</li>
            </ul>
            <p>
              Você pode alterar suas preferências de cookies a qualquer momento limpando os dados do navegador ou utilizando o botão de preferências no sistema.
            </p>
          </section>

          {/* Seção 7 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-foreground/10 pb-2">
              <HelpCircle size={18} className="text-primary shrink-0" />
              7. Contato e Encarregado pelo Tratamento (DPO)
            </h2>
            <p>
              Caso tenha dúvidas sobre os termos, deseje solicitar esclarecimentos ou exercer os direitos descritos nesta política, entre em contato através dos canais de suporte ao cidadão:
            </p>
            <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-foreground">Encarregado de Proteção de Dados (DPO) - GeoLimp</p>
                <p className="text-foreground/70">Atendimento ao Cidadão e Ouvidoria Municipal</p>
                <p className="text-primary font-semibold">privacidade@geolimp.com.br</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-foreground/10">
          <p className="text-xs text-foreground/60 text-center sm:text-left">
            © {new Date().getFullYear()} GeoLimp - Todos os direitos reservados. Gestão de Zeladoria Urbana.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="rounded-xl px-6 bg-primary text-primary-foreground font-semibold"
          >
            Voltar ao Início
          </Button>
        </div>
      </main>
    </div>
  );
}

