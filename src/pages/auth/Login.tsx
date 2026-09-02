import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Logo } from '@/shared/components/Logo';
import { useAuthStore } from '@/store/useAuthStore';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mocking auth for now
    if (username && password) {
      login('fake-jwt-token-12345', {
        id: '1',
        name: 'Admin User',
        email: username,
        role: 'root'
      });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo className="w-16 h-16 mx-auto text-primary" />
      </div>
      <Card className="w-full max-w-md shadow-2xl border-border">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Acesso Restrito</CardTitle>
          <CardDescription>Insira suas credenciais para acessar o painel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">Usuário</label>
              <Input 
                id="username" 
                type="text" 
                placeholder="Ex: geolimproot" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Senha</label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full mt-4" size="lg">Entrar</Button>
            <Button variant="ghost" type="button" className="w-full" onClick={() => navigate('/')}>
              Voltar para a página inicial
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
