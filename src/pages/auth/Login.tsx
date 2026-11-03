import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Logo } from '@/shared/components/Logo';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/lib/api';
import { Loader2, Eye, EyeOff, Sun, Moon, X } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      let userData = response.data.user;

      if (userData && userData.role) {
        userData.role = userData.role.toLowerCase();
      }

      login(userData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao realizar login. Verifique suas credenciais.');
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
          <h2 className="text-3xl font-bold text-foreground">Acesso ao Sistema</h2>
          <p className="text-foreground/70 text-sm">Insira suas credenciais para continuar</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
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

          {error && <p className="text-destructive text-sm text-center font-medium animate-in fade-in">{error}</p>}

          <Button type="submit" className="w-full h-11 mt-4 text-base font-semibold" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
            Entrar
          </Button>

          <div className="text-center mt-6">
            <p className="text-sm text-foreground/70">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Cadastre-se
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
