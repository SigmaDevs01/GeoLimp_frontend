import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/shared/components/Logo';
import { useThemeStore } from '@/store/useThemeStore';
import { useModalStore } from '@/store/useModalStore';
import { Moon, Sun, MapPin, Camera, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "Buraco na via / rua",
  "Entulho",
  "Lixo acumulado",
  "Iluminação pública",
  "Problemas em calçadas",
  "Sinalização danificada",
  "Semáforo com defeito",
  "Pavimentação",
  "Drenagem / alagamento",
  "Árvore ou vegetação interferindo na via (Poda/Manejo)",
  "Outros problemas de infraestrutura."
];

export function LandingPage() {
  const { theme, toggleTheme } = useThemeStore();
  const { openModal } = useModalStore();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  
  // Geolocation states
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo navegador.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        setLocationError('Permissão negada ou erro ao buscar localização.');
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !category || !description) return;

    openModal({
      title: "Confirmar Envio",
      description: `Você está prestes a enviar uma denúncia sobre "${category}" em "${address}". Deseja prosseguir?`,
      confirmText: "Sim, enviar",
      cancelText: "Cancelar",
      onConfirm: () => {
        // Here we will call the API using React Query mutation later
        console.log("Submitting payload:", {
          address,
          category,
          description,
          latitude: location?.lat,
          longitude: location?.lng,
          photo
        });
        // Reset form for now
        setAddress('');
        setCategory('');
        setDescription('');
        setPhoto(null);
        setLocation(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card relative z-20">
        <div className="flex items-center gap-2">
          <Logo className="h-10 w-auto text-primary" />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="default" onClick={() => navigate('/login')}>
            Acesso Restrito
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

        <div className="z-10 w-full max-w-lg mt-8 mb-8">
          <Card className="border-border shadow-2xl bg-card/80 backdrop-blur-md">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl font-bold tracking-tight">Nova Denúncia</CardTitle>
              <CardDescription>
                Ajude a manter a cidade limpa relatando problemas na sua região.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium">
                    Endereço ou Ponto de Referência <span className="text-destructive">*</span>
                  </label>
                  <Input 
                    id="address" 
                    placeholder="Ex: Rua das Flores, 123" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    O que você encontrou? <span className="text-destructive">*</span>
                  </label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Descrição do problema <span className="text-destructive">*</span>
                  </label>
                  <Textarea 
                    id="description" 
                    placeholder="Descreva com detalhes o que aconteceu..." 
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="photo" className="text-sm font-medium flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Anexar Foto (Opcional)
                  </label>
                  <Input 
                    id="photo" 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    className="cursor-pointer file:text-primary file:font-semibold"
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    type="button" 
                    variant={location ? "secondary" : "outline"} 
                    className="w-full flex items-center gap-2 justify-center"
                    onClick={handleGetLocation}
                    disabled={isLocating || !!location}
                  >
                    {isLocating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Buscando...</>
                    ) : location ? (
                      <><MapPin className="w-4 h-4 text-green-500" /> Localização Capturada</>
                    ) : (
                      <><MapPin className="w-4 h-4" /> Obter minha localização (Opcional)</>
                    )}
                  </Button>
                  {locationError && <p className="text-xs text-destructive mt-1 text-center">{locationError}</p>}
                </div>

                <Button className="w-full mt-6" size="lg" type="submit" disabled={!address || !category || !description}>
                  Enviar Denúncia
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
