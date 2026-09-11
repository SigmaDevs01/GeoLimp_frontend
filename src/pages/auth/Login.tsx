import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Logo } from '@/shared/components/Logo';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const token = response.data.access_token || response.data.token;
      let userData = response.data.user;

      if (!userData && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userData = {
            id: payload.sub,
            email: payload.email || email,
            role: payload.role?.toLowerCase() || 'cidadao',
            name: 'Usuário'
          };
        } catch (e) {
          userData = { id: '1', name: 'Usuário', email, role: 'cidadao' };
        }
      } else if (userData && userData.role) {
        userData.role = userData.role.toLowerCase();
      }

      login(token, userData);
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

      <div className="mb-8 z-10 flex flex-col items-center gap-2">
        <Logo className="w-16 h-16 text-foreground" />
        <h1 className="text-2xl font-bold tracking-wide">GeoLimp</h1>
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
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/5 dark:bg-white/5 border-foreground/20 text-foreground"
              required
            />
          </div>

          {error && <p className="text-destructive text-sm text-center font-medium animate-in fade-in">{error}</p>}

          <Button type="submit" className="w-full h-11 mt-4 text-base font-semibold" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
            Entrar
          </Button>

          <div className="text-center mt-6 flex flex-col gap-2">
            <p className="text-sm text-foreground/70">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Cadastre-se
              </Link>
            </p>
            <Button variant="ghost" type="button" className="w-full text-foreground/60 hover:text-foreground" onClick={() => navigate('/')}>
              Voltar para o Mapa
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
