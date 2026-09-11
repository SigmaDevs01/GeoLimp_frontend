import { X, Navigation, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

interface BottomDetailCardProps {
  complaint: any;
  onClose: () => void;
}

export function BottomDetailCard({ complaint, onClose }: BottomDetailCardProps) {
  const { user } = useAuthStore();
  
  if (!complaint) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl pointer-events-none px-4">
      <div className="glass-panel p-6 rounded-3xl pointer-events-auto animate-in slide-in-from-bottom-8 fade-in duration-500 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-foreground/50 hover:text-foreground transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - Image (if any) or Icon */}
          <div className="w-full md:w-1/3 aspect-video md:aspect-square bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-foreground/10 overflow-hidden">
            {complaint.photoUrl ? (
              <img src={complaint.photoUrl} alt="Denúncia" className="w-full h-full object-cover" />
            ) : (
              <Info className="w-12 h-12 text-foreground/20" />
            )}
          </div>

          {/* Right Column - Details */}
          <div className="flex-1 flex flex-col justify-between py-2">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-foreground capitalize">
                  {complaint.category}
                </h3>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider ${
                  complaint.status === 'resolvido' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                  complaint.status === 'em_andamento' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                  'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                }`}>
                  {complaint.status}
                </span>
              </div>
              
              <div className="flex items-start gap-2 text-foreground/70 mb-4 mt-4">
                <Navigation size={16} className="mt-1 flex-shrink-0 text-primary" />
                <p className="text-sm font-medium">{complaint.address || `${complaint.latitude}, ${complaint.longitude}`}</p>
              </div>

              <p className="text-foreground/80 text-sm mb-4 leading-relaxed line-clamp-3">
                {complaint.description}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-foreground/10">
              <div className="flex items-center gap-2 text-foreground/50 text-xs font-medium">
                <Calendar size={14} />
                <span>{complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('pt-BR') : 'Data não informada'}</span>
              </div>
              
              {user?.role !== 'cidadao' && (
                <Button className="h-9 px-6 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                  Criar Ordem de Serviço
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
