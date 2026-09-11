import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Logo } from '@/shared/components/Logo';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/register', { name, email, password, phone });
      // Redirect to login after successful registration
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

      <div className="mb-8 z-10 flex flex-col items-center gap-2">
        <Logo className="w-16 h-16 text-foreground" />
        <h1 className="text-2xl font-bold tracking-wide">GeoLimp</h1>
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
              placeholder="(00) 00000-0000" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            Cadastrar
          </Button>

          <div className="text-center mt-6 flex flex-col gap-2">
            <p className="text-sm text-foreground/70">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Fazer Login
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
