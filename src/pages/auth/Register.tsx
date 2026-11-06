import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Logo } from '@/shared/components/Logo';
import { api } from '@/lib/api';
import { useThemeStore } from '@/store/useThemeStore';
import { maskPhone, normalizePhoneForApi } from '@/shared/utils/phone.utils';
import { Loader2, Eye, EyeOff, Sun, Moon, X, MessageCircle } from 'lucide-react';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const normalizedPhone = normalizePhoneForApi(phone);
      await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        phone: normalizedPhone, 
        whatsappNotifications 
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => navigate('/')}
          title="Voltar para o Mapa"
          aria-label="Voltar para o Mapa"
          className="p-3 rounded-full bg-background/50 backdrop-blur-sm border border-foreground/10 text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-all shadow-sm cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-50">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="p-3 rounded-full bg-background/50 backdrop-blur-sm border border-foreground/10 text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-all shadow-sm cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="mb-8 z-10 flex flex-col items-center gap-2">
        <Logo showName className="w-auto h-20 text-foreground" />
      </div>
      
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl z-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-bold text-foreground">Cadastro Cidadão</h2>
          <p className="text-foreground/70 text-sm">Crie sua conta para participar da zeladoria da cidade</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-foreground/90">Nome Completo</label>
            <Input 
              id="name" 
              type="text" 
              placeholder="João da Silva" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/5 dark:bg-white/5 border-foreground/20 text-foreground"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-foreground/90">E-mail</label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/5 dark:bg-white/5 border-foreground/20 text-foreground"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm font-medium text-foreground/90">Telefone / WhatsApp</label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="(99) 99999-9999" 
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              onBlur={() => {
                if (phone) {
                  // Ao sair do campo, formata com o 9 inserido caso o usuário tenha digitado apenas 8 dígitos
                  const norm = normalizePhoneForApi(phone);
                  if (norm) {
                    setPhone(maskPhone(norm.startsWith('55') ? norm.slice(2) : norm));
                  }
                }
              }}
              className="bg-black/5 dark:bg-white/5 border-foreground/20 text-foreground"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-foreground/90">Senha</label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/5 dark:bg-white/5 border-foreground/20 text-foreground pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Notificações WhatsApp Checkbox */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-green-500/10 border border-green-500/25 transition-colors">
            <input
              id="whatsappNotifications"
              type="checkbox"
              checked={whatsappNotifications}
              onChange={(e) => setWhatsappNotifications(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-foreground/30 text-green-600 focus:ring-green-500 accent-green-600 cursor-pointer shrink-0"
            />
            <label htmlFor="whatsappNotifications" className="text-xs text-foreground/80 cursor-pointer select-none leading-relaxed">
              <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5 mb-0.5">
                <MessageCircle size={14} />
                Notificações no WhatsApp
              </span>
              Concordo em receber mensagens no WhatsApp com atualizações de status das minhas denúncias.
            </label>
          </div>

          {error && <p className="text-destructive text-sm text-center font-medium animate-in fade-in">{error}</p>}

          <Button type="submit" className="w-full h-11 mt-2 text-base font-semibold" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
            Cadastrar
          </Button>

          <div className="text-center mt-6">
            <p className="text-sm text-foreground/70">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Fazer Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
