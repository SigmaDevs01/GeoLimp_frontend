import { Logo } from '@/shared/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map as MapIcon, Package, Users, Truck, Settings, LogOut, Search, Clock } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { OSMap } from '@/features/map/components/OSMap';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Dashboard() {
  const { toggleTheme } = useThemeStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* 1. Sidebar (Minimalista) */}
      <aside className="w-20 border-r border-border bg-card flex flex-col items-center py-6 gap-8 z-10">
        <Logo className="w-12 h-12" />
        <nav className="flex flex-col gap-4 flex-1 mt-4">
          <Button variant="secondary" size="icon" className="rounded-full w-12 h-12">
            <MapIcon className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 text-muted-foreground hover:text-foreground">
            <Package className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 text-muted-foreground hover:text-foreground">
            <Truck className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 text-muted-foreground hover:text-foreground">
            <Users className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 text-muted-foreground hover:text-foreground">
            <Settings className="w-6 h-6" />
          </Button>
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" onClick={toggleTheme}>
            <Clock className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 text-destructive">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </aside>

      {/* 2. List Panel */}
      <section className="w-[400px] border-r border-border bg-card flex flex-col z-10 relative shadow-xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold mb-4">Gestão de OS</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 bg-background" placeholder="Buscar protocolo..." />
          </div>
          
          <div className="flex bg-background p-1 rounded-md mt-4 gap-1 overflow-x-auto no-scrollbar">
            <button className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-1.5 rounded-md px-2 whitespace-nowrap">EM ANDAMENTO</button>
            <button className="flex-1 text-muted-foreground text-xs font-semibold py-1.5 rounded-md hover:text-foreground transition-colors px-2 whitespace-nowrap">PENDENTE</button>
            <button className="flex-1 text-muted-foreground text-xs font-semibold py-1.5 rounded-md hover:text-foreground transition-colors px-2 whitespace-nowrap">CONCLUÍDA</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Fake Cards Loop */}
          {[1, 2, 3].map((i) => (
            <Card key={i} className="cursor-pointer hover:border-primary transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-sm">#DEN-2026-00124{i}</span>
                  <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Em Andamento</Badge>
                </div>
                <h3 className="font-medium text-base mb-1">Lixo Acumulado</h3>
                <div className="flex items-start gap-2 text-muted-foreground text-sm">
                  <div className="flex flex-col border-l-2 border-border ml-1 pl-4 py-1 gap-2">
                    <p>Av. Paulista, 1578 - Bela Vista</p>
                    <p className="text-xs">Equipe Alpha</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. Map Area */}
      <main className="flex-1 relative bg-muted flex items-center justify-center z-0">
        <OSMap />

        {/* Floating Details Card */}
        <div className="absolute bottom-6 right-6 w-96 z-[400]">
          <Card className="shadow-2xl border-border bg-card/95 backdrop-blur-md">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                <h4 className="font-bold text-lg">Ordem #DEN-2026-001241</h4>
                
                <Select defaultValue="EM_ANDAMENTO">
                  <SelectTrigger className="w-[150px] h-8 text-xs font-semibold bg-primary/10 border-primary/20 text-primary">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">EM ANDAMENTO</SelectItem>
                    <SelectItem value="CONCLUIDA">CONCLUÍDA</SelectItem>
                  </SelectContent>
                </Select>

              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">J</div>
                <div>
                  <p className="font-medium text-sm">João Silva</p>
                  <p className="text-xs text-muted-foreground">Líder da Equipe Alpha</p>
                </div>
              </div>
              <Button className="w-full">Ver Detalhes Completos</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
